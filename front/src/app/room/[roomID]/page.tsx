"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { initsocket } from "../../../socket.js";
import { Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation.js";
import { toast } from "react-hot-toast";
interface ConnectedClient {
  socketId: string;
  username: string;
}
function page() {
  const params = useParams();
  const [text, setText] = useState("");
  const roomId = params.roomID;
  const socketRef = useRef<Socket | null>(null);

  const searchParams = useSearchParams();
  const usernameQuery = searchParams.get("username");
  const [clients, setClients] = useState<ConnectedClient[]>([]);
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    const init = async () => {
      console.log(`sync text out in useEffect: ${text}`);

      socketRef.current = await initsocket();

      socketRef.current.emit("join", { roomId, username:usernameQuery });

      socketRef.current.on("joined", ({ clients, username, socketId }) => {
        console.log(`username: ${username} usernameQuery: ${usernameQuery}`);
          if (username !== usernameQuery &&socketRef.current) {
            toast.success(`${username} joined the room.`);
            socketRef.current.emit("sync_text", {
              socketId,
              text:textRef.current 
            });
          }

        setClients(clients);
      });

      socketRef.current.on("text_change", ({text}) => {
        console.log(`data ${text}`);
        if (text) setText(text);
      });
    };
    init();
    () => {
      socketRef.current?.disconnect();
      socketRef.current?.off('*');
    };
  }, []);

  const syncMsgOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setText(e.target.value)
    if (socketRef.current !== null) {
      socketRef.current.emit("text_change", {
        roomId,
        text: e.target.value,
      });
    }
  };
  console.log(text);
  return (
    <div>
      <textarea
        
        name="textToSync"
        id="textArea"
        cols={30}
        rows={10}
        className="text-black leading-5"
        onChange={(e) => {
          syncMsgOnChange(e);
        }}
        value={text}
      ></textarea>

      <div>
        {clients.map((client) => (
          <div key={client.socketId}>{client.username}</div>
        ))}
      </div>
    </div>
  );
}

export default page;
