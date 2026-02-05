  import { useEffect, useRef, useState } from "react";

  export function useChatWebSocket(conversationId, onMessage, onTyping) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
      if (!conversationId) return;

      const wsUrl = `ws://localhost:8000/ws/chat/${conversationId}/`;
      console.log("🔌 Connecting:", wsUrl);

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("✅ Connected");
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          onMessage?.(data.message);
        }

        if (data.type === "typing") {
          onTyping?.(data.user_id, data.is_typing);
        }
      };

      socket.onclose = () => {
        console.log("🔌 Disconnected");
        setIsConnected(false);
      };

      socket.onerror = (err) => {
        console.log("❌ WebSocket Error:", err);
      };

      return () => {
        console.log("🧹 Closing socket");
        socket.close();
      };
    }, [conversationId]);

    const sendTypingIndicator = (isTyping) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "typing",
            is_typing: isTyping,
          })
        );
      }
    };

    return { isConnected, sendTypingIndicator };
  }
