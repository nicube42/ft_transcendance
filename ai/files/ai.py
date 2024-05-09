import asyncio
import websockets
import json
import numpy as np
import time
import ssl
import os

connected = set()

def impact_pos_y(ball_pos_x, ball_pos_y, ball_speed_x, ball_speed_y, paddle_left_y, paddle_right_y, paddle_height, canvas_width, canvas_height, ball_radius, update_ai):

    if ball_speed_x <= 0:
        return canvas_height / 2
    
    frames_before_impact = ((canvas_width - 10) - (ball_pos_x + ball_radius)) / ball_speed_x
    nextframe = 1

    while nextframe < int(frames_before_impact):
        if ball_pos_y + ball_radius + ball_speed_y > canvas_height or ball_pos_y - ball_radius + ball_speed_y  < 0:
            
            if ball_speed_y < 0:
                deltaFrame = -(ball_pos_y - ball_radius)/ball_speed_y 
            else:
                 deltaFrame = (canvas_height - (ball_pos_y + ball_radius))/ball_speed_y

            ball_pos_y += deltaFrame * ball_speed_y + (1 - deltaFrame) * ball_speed_y
            ball_speed_y *= -1
        else :
            ball_pos_y += ball_speed_y
        nextframe += 1
    return ball_pos_y

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

                if update_ai is True:
                    future_ball_pos_y = impact_pos_y(ball_pos_x, ball_pos_y, ball_speed_x, ball_speed_y, paddle_left_y, paddle_y, paddle_height, canvas_width, canvas_height, 10, update_ai)

                paddle_center = paddle_y + paddle_height / 2

                action = "DOWN" if paddle_center < future_ball_pos_y else "UP"

                response = json.dumps({
                    "action": action,
                    "predicted_pos_y": future_ball_pos_y
                })

                await websocket.send(response)

            except websockets.exceptions.ConnectionClosed as e:
                break
            except Exception as e:
                continue
    finally:
        connected.remove(websocket)

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
cert_path = os.getenv('SSL_CERT_PATH', '/app/ssl/domain.crt')
key_path = os.getenv('SSL_KEY_PATH', '/app/ssl/domain.key')

try:
    ssl_context.load_cert_chain(cert_path, key_path)
except FileNotFoundError as e:
    raise SystemExit(e)

server = websockets.serve(ai_server, "0.0.0.0", 5678, ssl=ssl_context)

asyncio.get_event_loop().run_until_complete(server)
asyncio.get_event_loop().run_forever()

