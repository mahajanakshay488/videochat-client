import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// const socket = io('http://localhost:5000');
const socket = io('https://vchatserver-g60f.onrender.com');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // useEffect(() => {
  //   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  //     .then((currentStream) => {
  //       setStream(currentStream);

  //       myVideo.current.srcObject = currentStream;
  //     });

  //   socket.on('me', (id) => setMe(id));

  //   socket.on('callUser', ({ from, name: callerName, signal }) => {
  //     setCall({ isReceivingCall: true, from, name: callerName, signal });
  //   });
  // }, []);

  useEffect(() => {
    // console.log("navigator ", navigator);
    // console.log("navigator.mediaDevices ", navigator.mediaDevices);
    // console.log("myVideo ", myVideo);
    // console.log("myVideo current ", myVideo.current);

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        console.log("myVideo",myVideo, "myVideo current", myVideo.current);
        console.log("currentStream ", currentStream);
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
      });
    socket.on('me', (id) => setMe(id));
  
    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
      console.log('recievingCall signal: ', signal);
    });
  }, [myVideo, myVideo.current]);
  

  const answerCall = () => {
    setCallAccepted(true);
  
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      // config: {
      //   iceServers: [
      //     { urls: 'stun:stun.l.google.com:19302' },
      //     { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      //   ],
      // },
    });
  
    peer.on('signal', (data) => {
      console.log("peer on signal answerCall: ", data);
      socket.emit('answerCall', { signal: data, to: call.from });
    });
  
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
  
    peer.signal(call.signal);
  
    connectionRef.current = peer;
  };
  
  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      // config: {
      //   iceServers: [
      //     { urls: 'stun:stun.l.google.com:19302' },
      //     { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      //   ],
      // },
    });
  
    peer.on('signal', (data) => {
      console.log('callUSer on signal: ', data);
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    });
  
    peer.on('stream', (currentStream) => {
      console.log('peer on userStream: ', currentStream);
      userVideo.current.srcObject = currentStream;
    });
  
    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      console.log("acceptedCall signal: ", signal);
      peer.signal(signal);
    });
  
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
