"use client";
import Link from "next/link";
import { useState } from "react";
export default function Home() {
  const [roomId, setroomId] = useState("");
  const [username, setUserName] = useState("");

  // redirect to the room
  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24">
      <div >
        <p>Room ID:</p>
        
        <input
          type="text"
          className="text-black"
          onChange={(e) => setroomId(e.target.value)}
        />

        <p>Username</p>
        <input
          type="text"
          className="text-black"
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>

        <Link href={`/room/${roomId}?username=${username}`}>Join</Link>
    </main>
  );
}
