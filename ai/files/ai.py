import asyncio
import websockets
import json
import numpy as np
import time

connected = set()

def predict_ball_position_at_right_paddle(ball_pos_x, ball_pos_y, ball_speed_x, ball_speed_y, paddle_left_y, paddle_right_y, paddle_height, canvas_width, canvas_height, ball_radius, update_ai):
    """
    Predict the ball's y position when it reaches the right edge of the screen, considering collisions with the top,
    bottom walls, and paddles.
    """
    time_step = 0.01  # Smaller time step for more precision in prediction
    start_time = time.time()

    while ball_pos_x + ball_radius < canvas_width:
        if ball_speed_x == 0:
            return
        # Calculate next position
        next_ball_pos_x = ball_pos_x + ball_speed_x * time_step
        next_ball_pos_y = ball_pos_y + ball_speed_y * time_step

        # Check collision with the top and bottom walls
        if next_ball_pos_y - ball_radius <= 0 or next_ball_pos_y + ball_radius >= canvas_height:
            ball_speed_y *= -1  # Invert Y speed on collision
            next_ball_pos_y = ball_pos_y  # Revert to previous y position before updating for next frame

        # Check for collision with left paddle
        if 0 < ball_pos_x < 10 + ball_radius and paddle_left_y <= ball_pos_y <= paddle_left_y + paddle_height:
            ball_speed_x *= -1  # Invert X speed on paddle collision
            next_ball_pos_x = ball_pos_x  # Revert to previous x position before updating for next frame

        # Check for collision with right paddle
        if canvas_width - 10 - ball_radius < ball_pos_x < canvas_width and paddle_right_y <= ball_pos_y <= paddle_right_y + paddle_height:
            ball_speed_x *= -1  # Invert X speed on paddle collision
            next_ball_pos_x = ball_pos_x  # Revert to previous x position before updating for next frame

        # Update ball position
        ball_pos_x = next_ball_pos_x
        ball_pos_y = next_ball_pos_y

        if time.time() - start_time > 1:
            print("Breaking after 1 seconds")
            ball_pos_y = -1
            break

        # If we've reached the right edge, no need to continue
        if ball_pos_x + ball_radius >= canvas_width:
            break

        if ball_pos_x + ball_radius < 0:
            break
    
    return ball_pos_y  # Return the Y position when the ball reaches the right edge


async def ai_server(websocket, path):
    global connected
    connected.add(websocket)
    try:
        while True:
            try:
                message = await websocket.recv()
                data = json.loads(message)
                ball_pos_x = data['ball_pos_x']
                ball_pos_y = data['ball_pos_y']
                ball_speed_x = data['ball_speed_x']
                ball_speed_y = data['ball_speed_y']
                paddle_y = data['paddle_y']
                paddle_left_y = data['paddle_left_y']
                paddle_height = data['paddle_height']
                canvas_width = data['canvas_width']
                canvas_height = data['canvas_height']
                update_ai = data['update_ai']

                # Simulate ball movement to predict future position
                # future_ball_pos_y = simulate_ball_movement(ball_pos_x, ball_pos_y, ball_speed_x, ball_speed_y, paddle_y, paddle_y, paddle_height, canvas_width, canvas_height)

                if update_ai is True:
                    future_ball_pos_y = predict_ball_position_at_right_paddle(ball_pos_x, ball_pos_y, ball_speed_x, ball_speed_y, paddle_left_y, paddle_y, paddle_height, canvas_width, canvas_height, 10, update_ai)

                print(f"Predicted ball position: {future_ball_pos_y}")

                # Determine the center of the paddle
                paddle_center = paddle_y + paddle_height / 2

                # Decide to move the paddle up or down to go towards the predicted ball's Y position
                action = "DOWN" if paddle_center < future_ball_pos_y else "UP"

                # Send a single JSON response
                response = json.dumps({
                    "action": action,
                    "predicted_pos_y": future_ball_pos_y
                })

                await websocket.send(response)

            except websockets.exceptions.ConnectionClosed as e:
                print(f"Connection closed with reason: {e}")
                break  # Break the loop and end the handler properly
            except Exception as e:
                print(f"Unhandled error: {e}")
                continue
    finally:
        connected.remove(websocket)
        print("Connection handler ended.")

start_server = websockets.serve(ai_server, "0.0.0.0", 5678)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
