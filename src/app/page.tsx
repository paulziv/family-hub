"use client";

import { useEffect, useState } from "react";
import { haService } from "@/lib/homeAssistant";
import { HassEntities } from "home-assistant-js-websocket";

export default function Home() {
  const [entities, setEntities] = useState<HassEntities | null>(null);
  const [status, setStatus] = useState("Disconnected");

  useEffect(() => {
    // Note: We need URL and token to actually connect
    const url = process.env.NEXT_PUBLIC_HA_URL || "";
    const token = process.env.NEXT_PUBLIC_HA_TOKEN || "";

    if (url && token) {
      console.log("Attempting connection to:", url);
      console.log("Token exists, length:", token.length);
      setStatus("Connecting...");
      haService.connect(url, token)
        .then(() => {
          console.log("Connection successful!");
          setStatus("Connected");
          haService.subscribeToEntities((data) => {
            setEntities(data);
          });
        })
        .catch(() => {
          setStatus("Connection Failed");
        });
    } else {
      setStatus("Missing Credentials");
    }
  }, []);

  return (
    <main className="dashboard-container">
      <h1 className="page-title">Family Hub</h1>
      <div className="grid-layout">
        
        {/* Smart Home Controls */}
        <section className="glass-panel">
          <h2 className="glass-header">Smart Home</h2>
          <p>Status: {status}</p>
          <div style={{ marginTop: '1rem', opacity: 0.8 }}>
            {entities ? (
              <p>{Object.keys(entities).length} Entities Loaded</p>
            ) : (
              <p>Please configure .env.local with HA credentials to see your devices.</p>
            )}
          </div>
        </section>

        {/* Family Tasks */}
        <section className="glass-panel">
          <h2 className="glass-header">Tasks</h2>
          <p style={{ opacity: 0.8 }}>No tasks for today. Great job!</p>
          {/* List of tasks fetched from HA would go here */}
        </section>

        {/* Family Calendar */}
        <section className="glass-panel">
          <h2 className="glass-header">Calendar</h2>
          <p style={{ opacity: 0.8 }}>No upcoming events.</p>
          {/* iCloud Calendar info from HA CalDAV goes here */}
        </section>
        
      </div>
    </main>
  );
}
