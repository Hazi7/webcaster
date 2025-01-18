import { Button, Input } from "@headlessui/react";
import { FlvStreamer } from "flv-muxer";
import { useRef, useState } from "react";

export default function Player() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [err, setErr] = useState<unknown | Error>(new Error(""));

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function getDisplayMedia() {
    return navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: {
          ideal: 30,
          max: 30,
        },
        width: 1920,
        height: 1080,
      },
      audio: {},
    });
  }

  let ws: WebSocket | undefined;

  const writable = new WritableStream({
    write: (chunk) => {
      if (ws?.readyState === 1) {
        ws.send(chunk);
      }
    },
  });

  const flvMuxer = new FlvStreamer(writable);
  const videoHandler = flvMuxer.getVideoChunkHandler();
  const audioHandler = flvMuxer.getAudioChunkHandler();

  if (!videoHandler) return;
  if (!audioHandler) return;

  const videoEncoder = new VideoEncoder({
    output: videoHandler,
    error: (error) => {
      // 处理编码过程中的错误
      console.error("VideoEncoder error:", error);
    },
  });

  videoEncoder.configure({
    codec: "avc1.640034",
    width: 1920,
    height: 1080,
  });

  const audioEncoder = new AudioEncoder({
    output: audioHandler,
    error: (error) => {
      // 处理编码过程中的错误
      console.error("VideoEncoder error:", error);
    },
  });

  audioEncoder.configure({
    codec: "mp4a.40.5",
    sampleRate: 48000,
    numberOfChannels: 1,
    bitrate: 128000,
  });

  async function startRecording() {
    try {
      setIsStreaming(true);
      const stream = await getDisplayMedia();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      flvMuxer.start();

      // 创建两个独立的处理函数
      async function processVideo() {
        const videoReadableStream = new MediaStreamTrackProcessor({
          track: videoTrack,
        }).readable;

        for await (const chunk of videoReadableStream) {
          videoEncoder.encode(chunk);
          chunk.close();
        }
      }

      async function processAudio() {
        const audioReadableStream = new MediaStreamTrackProcessor({
          track: audioTrack,
        }).readable;

        for await (const chunk of audioReadableStream) {
          audioEncoder.encode(chunk);
          chunk.close();
        }
      }

      // 并行处理视频和音频
      Promise.all([processVideo(), processAudio()]).catch((error) => {
        console.error("Stream processing error:", error);
      });

      const url = inputRef.current?.value;
      console.log(url);

      if (url) {
        ws = new WebSocket(url);
      }
    } catch (error) {
      setErr(error);
    }
  }

  async function stopRecording() {
    videoEncoder.flush();
    videoEncoder.close();

    audioEncoder.flush();
    audioEncoder.close();

    ws?.close();

    setIsStreaming(false);
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        className="w-[480px] h-[320px] bg-gray-600 items-center rounded-lg"
      ></video>
      <div className="w-full px-4 flex justify-center m-4">
        <Input
          className="border w-[256px] h-[32px] border-gray-500 rounded-lg text-sm pl-3"
          placeholder="推流地址"
          ref={inputRef}
        />
      </div>
      <div>
        <Button
          className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white"
          onClick={startRecording}
        >
          {isStreaming ? "推流中..." : "开始推流"}
        </Button>
        <Button
          className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white ml-6"
          onClick={stopRecording}
        >
          结束推流
        </Button>
      </div>
      <div className="text-red-300">{err && err.message}</div>
    </div>
  );
}
