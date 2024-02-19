import asyncio
import websockets
import json
import numpy as np

connected = set()

async def ai_server(websocket, path):
    global connected
    connected.add(websocket)
    try:
        while True:
            message = await websocket.recv()
            data = json.loads(message)  # Assuming the message is a JSON string
            ball_y = data['ball_y']
            paddle_y = data['paddle_y']
            paddle_height = data['paddle_height']  # Assuming this is sent to make a decision based on paddle size
            
            # Determine the center of the paddle
            paddle_center = paddle_y + paddle_height / 2
            
            # Decide to move the paddle up or down to go towards the ball's Y position
            if paddle_center < ball_y:
                action = "DOWN"
            else:
                action = "UP"
            
            await websocket.send(action)
    finally:
        connected.remove(websocket)


start_server = websockets.serve(ai_server, "0.0.0.0", 5678)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
