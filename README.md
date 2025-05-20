# Millionaire's Club

This repository includes the code for the backend of this web game. 
A real-time, turn-based multiplayer board game built with **React**, **Socket.IO**, and **Express**. Players take turns rolling dice, moving across a board, buying properties, drawing cards (Fortune or Chance), upgrading movers, and engaging in a chatroom — all in a competitive, Monopoly-style game. Users must create an account in order to gain access to the game. 

## Features

- 🎲 Dice-based movement with turn order
- 🏠 Property buying and rent logic
- 🃏 Chance and Fortune cards with custom effects
- 🕵️‍♂️ Jail system with doubles logic and bail
- 💬 Real-time chat between players
- 🎨 Animated background transitions based on location
- 🔄 State synced via Socket.IO

## Tech Stack

- **Frontend**: React + React Router + Socket.IO Client
- **Backend**: Node.js + Express + Socket.IO + MongoDB
- **Styling**: Bootstrap, inline styles, and custom CSS transitions

Users must create an account to gain access to the game. 
![image](https://github.com/user-attachments/assets/2349806a-cb83-491d-bb5a-02cfcf40c772)
![image](https://github.com/user-attachments/assets/89166b64-3a34-4ddc-8a1b-91cb39471131)

Once a user successfully logs in, they can either join an existing game or create their own game and wait for other players to join them
![image](https://github.com/user-attachments/assets/35e2e73d-1787-40ad-a94e-b34db21eaaba)
![image](https://github.com/user-attachments/assets/b7898039-13f1-4b25-9db7-a9c82d1c1277)
![image](https://github.com/user-attachments/assets/4dead68c-a75a-454e-ba71-4bcce8b18778)

Once a player creates or joins a room, they can choose their mover and click ready. Once all players are ready, the host can start the game
![image](https://github.com/user-attachments/assets/a7b38627-8d2e-4476-8a43-9b4de35e8a9f)

Once a game is started, each player clicks the button to roll the dice to determine turn order. Afterwards, players traverse through a board that is hidden to buy properties, collect cards, and increase their money until a player has reached $1,000,000. 
![image](https://github.com/user-attachments/assets/b6f570b8-0e6e-4269-96bc-b9e7ae8ee9ad)
![image](https://github.com/user-attachments/assets/49f9fb7a-bc40-42b9-9ec5-cc32019c2062)


