# import asyncio
# import websockets
# import json
# import numpy as np

# connected = set()

# async def ai_server(websocket, path):
#     global connected
#     connected.add(websocket)
#     try:
#         while True:
#             message = await websocket.recv()
#             data = json.loads(message)  # Assuming the message is a JSON string
#             ball_y = data['ball_y']
#             paddle_y = data['paddle_y']
#             paddle_height = data['paddle_height']  # Assuming this is sent to make a decision based on paddle size
            
#             # Determine the center of the paddle
#             paddle_center = paddle_y + paddle_height / 2
            
#             # Decide to move the paddle up or down to go towards the ball's Y position
#             if paddle_center < ball_y:
#                 action = "DOWN"
#             else:
#                 action = "UP"
            
#             await websocket.send(action)
#     finally:
#         connected.remove(websocket)


# start_server = websockets.serve(ai_server, "0.0.0.0", 5678)

# asyncio.get_event_loop().run_until_complete(start_server)
# asyncio.get_event_loop().run_forever()


import asyncio
import websockets
import json
import numpy as np

connected = set()

def simulate_ball_movement(ball_pos_x, ball_pos_y, ball_speed_x, ball_speed_y, paddle_left_y, paddle_right_y, paddle_height, canvas_width, canvas_height):
    """
    Simulate the ball's movement over one second, considering collisions with the top,
    bottom walls, and the potential to hit paddles.
    """
    frames_per_second = 60  # Game runs at approximately 60 fps
    time_step = 1 / frames_per_second  # time step per frame

    for _ in range(frames_per_second):
        # Predict the ball's next position
        ball_pos_x += ball_speed_x * time_step
        ball_pos_y += ball_speed_y * time_step

        # Check collision with the top and bottom walls
        if ball_pos_y < 0 or ball_pos_y > canvas_height:
            ball_speed_y *= -1  # Invert Y speed on collision

        # Check for collision with left paddle
        if ball_pos_x < 10 and (paddle_left_y <= ball_pos_y <= paddle_left_y + paddle_height):
            ball_speed_x *= -1  # Invert X speed on paddle collision

        # Check for collision with right paddle
        if ball_pos_x > canvas_width - 10 and (paddle_right_y <= ball_pos_y <= paddle_right_y + paddle_height):
            ball_speed_x *= -1  # Invert X speed on paddle collision

    return ball_pos_y  # Return the Y position after 1 second

async def ai_server(websocket, path):
    global connected
    connected.add(websocket)
    try:
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            ball_pos_x = data['ball_pos_x']
            ball_pos_y = data['ball_pos_y']
            ball_speed_x = data['ball_speed_x']
            ball_speed_y = data['ball_speed_y']
            paddle_y = data['paddle_y']
            paddle_height = data['paddle_height']
            canvas_width = data['canvas_width']
            canvas_height = data['canvas_height']

            # Simulate ball movement to predict future position
            future_ball_pos_y = simulate_ball_movement(ball_pos_x, ball_pos_y, ball_speed_x, ball_speed_y, paddle_y, paddle_y, paddle_height, canvas_width, canvas_height)

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
    finally:
        connected.remove(websocket)

start_server = websockets.serve(ai_server, "0.0.0.0", 5678)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
