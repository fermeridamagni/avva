import { Mic, MicOff } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export default function InterpreterTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16_000, // Request 16kHz if possible
        },
      });
      streamRef.current = stream;

      const ws = new WebSocket("ws://localhost:8000/ws/transcribe");
      wsRef.current = ws;

      ws.onopen = () => {
        setIsRecording(true);
        // Start processing audio
        const audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )({
          sampleRate: 16_000,
        });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContext.destination); // Required for processor to work

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x80_00 : s * 0x7f_ff;
            }
            ws.send(pcm16.buffer);
          }
        };
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.text) {
          setTranscript((prev) => prev + " " + data.text);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error", e);
        stopRecording();
      };

      ws.onclose = () => {
        stopRecording();
      };
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(
    () => () => {
      stopRecording();
    },
    []
  );

  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-foreground tracking-tight">
          Intérprete
        </h2>
        <motion.button
          className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 font-medium transition-colors ${
            isRecording
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
          }`}
          onClick={toggleRecording}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRecording ? (
            <>
              <MicOff className="h-5 w-5" />
              <span>Detener</span>
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              <span>Escuchar</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl bg-muted/30 p-6 backdrop-blur-md">
        {transcript ? (
          <p className="whitespace-pre-wrap text-foreground/90 text-xl leading-relaxed">
            {transcript}
          </p>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-lg text-muted-foreground">
              {isRecording
                ? "Escuchando... el texto aparecerá aquí"
                : "Presiona 'Escuchar' para transcribir voz a texto"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
