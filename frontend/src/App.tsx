import './App.css'

import { useState, useEffect } from "react";
import mqtt from "mqtt";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


function App() {
    const [heartRate, setHeartRate] = useState<number[]>([]); // อัตราการเต้นของหัวใจ
    const [oxygenLevel, setOxygenLevel] = useState<number[]>([]); // ปริมาณออกซิเจนในเลือด
    const [bodyTemperature, setBodyTemperature] = useState<number[]>([]); // อุณหภูมิร่างกาย

    const [rate, setRate] = useState<number>()
    const [oxygen, setOxygen] = useState<number>()
    const [temp, setTemp] = useState<number>()

    useEffect(() => {
        const client = mqtt.connect("ws://192.168.43.234:9001", { keepalive: 60 });
    
        client.on("connect", () => {
            console.log("Connected to MQTT Broker");
            client.subscribe("sensor/health");
            client.subscribe("sensor/temperature");
        });
    
        client.on("reconnect", () => {
            console.log("Reconnecting to MQTT Broker...");
            client.subscribe("sensor/health");
            client.subscribe("sensor/temperature");
        });
    
        client.on("message", (topic, message) => {
            const messageString = message.toString();
            console.log(`Received message on topic ${topic}: ${messageString}`);
    
            try {
                const data = JSON.parse(messageString);
    
                if (topic === "sensor/health") {
                    setRate(Number(data.heart_rate.toFixed(2)));
                    setOxygen(Number(data.spo2.toFixed(2)));
                    if (data.heart_rate && data.spo2) {
                        setHeartRate((prev) => [...prev, data.heart_rate].slice(-10));
                        setOxygenLevel((prev) => [...prev, data.spo2].slice(-10));
                    }
                } else if (topic === "sensor/temperature") {
                    setTemp(Number(data.celsius.toFixed(2)));
                    if (data.celsius) {
                        setBodyTemperature((prev) => [...prev, data.celsius].slice(-10));
                    }
                }
            } catch (error) {
                console.error("Error processing MQTT message:", error);
            }
        });
    
        client.on("close", () => {
            console.log("MQTT connection closed, reconnecting...");
            client.reconnect();
        });
        
        client.on("offline", () => {
            console.log("MQTT is offline, trying to reconnect...");
        });
        
    
        client.on("error", (error) => {
            console.error("MQTT Error:", error);
        });
    
        return () => {
            client.end();
        };
    }, []);
    

    // ข้อมูลสำหรับแสดงกราฟ
    const heartRateData = {
        labels: Array(heartRate.length).fill(""),
        datasets: [
            {
                label: "Heart Rate (bpm)",
                data: heartRate,
                fill: false,
                borderColor: "red",
                tension: 0.1,
            },
        ],
    };

    const oxygenLevelData = {
        labels: Array(oxygenLevel.length).fill(""),
        datasets: [
            {
                label: "Oxygen Level (%)",
                data: oxygenLevel,
                fill: false,
                borderColor: "green",
                tension: 0.1,
            },
        ],
    };

    const bodyTemperatureData = {
        labels: Array(bodyTemperature.length).fill(""),
        datasets: [
            {
                label: "Body Temperature (°C)",
                data: bodyTemperature,
                fill: false,
                borderColor: "blue",
                tension: 0.1,
            },
        ],
    };

    return (
        <div className='dashboard-page'>
            <div className="bg">
                <img src="background.jpg" alt="" />
            </div>
            <h1 className='title'>Health Dashboard</h1>
            <div className="description-section">
                <div className="heart-rate-box data-box">
                    <div className="img-box">
                        <img src="icons/heart-rate.png" alt="" />
                    </div>
                    <p>{rate} bpm</p>
                </div>
                <div className="oxygen-box data-box">
                    <div className="img-box">
                        <img src="icons/oxygen.png" alt="" />
                    </div>
                    <p>{oxygen}%</p>
                </div>
                <div className="temp-box data-box">
                    <div className="img-box">
                        <img src="icons/temp.png" alt="" />
                    </div>
                    <p>{temp}°C</p>
                </div>
            </div>
            <div className='dash-section'>
                <div className='dash'>
                    <h3>Heart Rate</h3>
                    <Line data={heartRateData} />
                </div>
                <div className='dash'>
                    <h3>Oxygen Level</h3>
                    <Line data={oxygenLevelData} />
                </div>
                <div className='dash'>
                    <h3>Body Temperature</h3>
                    <Line data={bodyTemperatureData} />
                </div>
            </div>
        </div>
    )
}

export default App
