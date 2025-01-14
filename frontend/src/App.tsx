import './App.css'

import { useState, useEffect } from "react";
import mqtt from "mqtt";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HealthMetric {
    metric: string;
    ageGroup: string;
    normalRange: string;
    high: string;
    low: string;
}


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
                    if (data.heart_rate < 150) {
                        setRate(Number(data.heart_rate.toFixed(2)));
                        setOxygen(Number(data.spo2.toFixed(2)));
                        if (data.heart_rate && data.spo2) {
                            setHeartRate((prev) => [...prev, data.heart_rate].slice(-10));
                            setOxygenLevel((prev) => [...prev, data.spo2].slice(-10));
                        }
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

    const healthData: HealthMetric[] = [
        {
            metric: "อัตราการเต้นของหัวใจ (Heart Rate)",
            ageGroup: "เด็ก (1-10 ปี)",
            normalRange: "70-120 ครั้ง/นาที",
            high: "มากกว่า 120 ครั้ง/นาที",
            low: "น้อยกว่า 70 ครั้ง/นาที",
        },
        {
            metric: "อัตราการเต้นของหัวใจ (Heart Rate)",
            ageGroup: "ผู้ใหญ่ (11-60 ปี)",
            normalRange: "60-100 ครั้ง/นาที",
            high: "มากกว่า 100 ครั้ง/นาที (Tachycardia)",
            low: "น้อยกว่า 60 ครั้ง/นาที (Bradycardia) ยกเว้นนักกีฬา",
        },
        {
            metric: "อัตราการเต้นของหัวใจ (Heart Rate)",
            ageGroup: "ผู้สูงอายุ (> 60 ปี)",
            normalRange: "60-100 ครั้ง/นาที",
            high: "มากกว่า 100 ครั้ง/นาที",
            low: "น้อยกว่า 60 ครั้ง/นาที",
        },
        {
            metric: "ค่าออกซิเจนในเลือด (SpO2)",
            ageGroup: "ทุกช่วงอายุ",
            normalRange: "95-100%",
            high: "-",
            low: "น้อยกว่า 94% (Hypoxemia)",
        },
        {
            metric: "อุณหภูมิร่างกาย (Body Temperature)",
            ageGroup: "ทุกช่วงอายุ",
            normalRange: "36.5-37.5°C",
            high: "มากกว่า 38°C (ไข้)",
            low: "น้อยกว่า 35°C (Hypothermia)",
        },
    ];




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
        <div className='dashboard-page ' >
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
            <div className='analysis'>
                <div className='table' >
                    <div style={{ padding: "20px" }}>
                        <h1 style={{ marginBottom: "20px" }}>ข้อมูลตัวชี้วัดสุขภาพ</h1>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                textAlign: "left",
                                backgroundColor: "#FFF",
                                border: "1px solid transparent",
                                boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.2)"
                            }}
                        >
                            <thead style={{ backgroundColor: "#79D7BE", color: "white", textAlign: "center" }}>
                                <tr>
                                    <th style={{ padding: "8px" }}>ตัวชี้วัด</th>
                                    <th style={{ padding: "8px" }}>ช่วงอายุ</th>
                                    <th style={{ padding: "8px" }}>ค่าปกติ</th>
                                    <th style={{ padding: "8px" }}>ค่าสูง</th>
                                    <th style={{ padding: "8px" }}>ค่าต่ำ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {healthData.map((data, index) => (
                                    <tr key={index}
                                        style={{
                                            backgroundColor: index % 2 === 0 ? "#F0F0F0" : "#FFFFFF", // เลขคู่เป็นสีเทา เลขคี่เป็นสีขาว
                                        }}>
                                        <td style={{ padding: "8px" }}>{data.metric}</td>
                                        <td style={{ padding: "8px" }}>{data.ageGroup}</td>
                                        <td style={{ padding: "8px" }}>{data.normalRange}</td>
                                        <td style={{ padding: "8px" }}>{data.high}</td>
                                        <td style={{ padding: "8px" }}>{data.low}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
