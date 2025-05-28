enum MessageType {
    SYSTEM = 'system',
    SENDER = 'sender',
    RECEIVER = 'receiver'
}

class RTC {
    private ws: WebSocket;
    private peerConnection: RTCPeerConnection;
    private dataChannel?: RTCDataChannel;

    constructor (url: string) {
        // console.log(`Connect to ${url}`);
        this.addMessage(MessageType.SYSTEM, `Websocket connect to ${url}`);

        this.ws = new WebSocket(`ws://${location.host}`);

        const configuration = {
        iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                // { urls: 'turn:your.turn.server', username: 'user', credential: 'pass' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        this.ws.addEventListener('open', event => {
            // console.log("Connected");
            this.addMessage(MessageType.SYSTEM, "Websocket connection established!");
        });

        this.ws.addEventListener('message', async event => {
            // console.log(event.data);
            const message = JSON.parse(event.data);
            // console.log(message);
            if (message.answer) {
                // console.log("Process answer!");
                const remoteDesc = new RTCSessionDescription(message.answer);
                await this.peerConnection.setRemoteDescription(remoteDesc);
            }
            else if (message.offer) {
                // console.log("Process offer!");
                this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);
                this.ws.send(JSON.stringify({answer: answer}));
                this.peerConnection.ondatachannel = (event) => {
                    this.dataChannel = event.channel;

                    this.dataChannel.onopen = () => {
                        // console.log("DataChannel open (callee)");
                        this.addMessage(MessageType.SYSTEM, "DataChannel open (callee)");
                        this.dataChannel?.send("Hello from callee!");
                    };

                    this.dataChannel.onmessage = (event) => {
                        // console.log("Message from caller:", event.data);
                        this.addMessage(MessageType.RECEIVER, event.data);
                    };
                };
            }
            else if (message['new-ice-candidate']) {
                // console.log("Process ice candidate!");
                try {
                    await this.peerConnection.addIceCandidate(message['new-ice-candidate']);
                } catch (e) {
                    this.addMessage(MessageType.SYSTEM, `Error adding received ice candidate: ${e}`);
                    // console.error('Error adding received ice candidate', e);
                }
            }
        });

        this.ws.addEventListener('error', event => {
            // console.log(`Error: ${event}`);
            this.addMessage(MessageType.SYSTEM, `Error at Websocket: ${event}`);
        });

        this.ws.addEventListener('close', event => {
            // console.log("Disconnected");
            this.addMessage(MessageType.SYSTEM, "Websocket connection closed!");
        });

        // Listen for local ICE candidates on the local RTCPeerConnection
        this.peerConnection.addEventListener('icecandidate', event => {
            // console.log("icecandidate!!!");
            if (event.candidate) {
                this.ws.send(JSON.stringify({'new-ice-candidate': event.candidate}));
            }
        });

        // Listen for connectionstatechange on the local RTCPeerConnection
        this.peerConnection.addEventListener('connectionstatechange', event => {
            if (this.peerConnection.connectionState === 'connected') {
                // Peers connected!
                // console.log("RTC peers connected!");
                this.addMessage(MessageType.SYSTEM, "RTC peers connected!");
            }
        });

        document.getElementById('startButton')?.addEventListener('click', (e: MouseEvent) => {
            this.makeCall();
        });

        document.getElementById("sendButton")?.addEventListener("click", () => {
            // console.log("send message!");
            const input = <HTMLInputElement>document.getElementById("messageInput");
            const message = input.value;
            this.dataChannel?.send(message);
            this.addMessage(MessageType.SENDER, message);
            this.clearInput();
        });
    }

    private addMessage(type: MessageType, text: string): void {
        if (text.replace(/\s/g, '') === '')
            return;

        const message_div = document.createElement('div');
        message_div.classList.add('message', type);

        const text_div = document.createElement('div');
        text_div.classList.add('text');
        message_div.appendChild(text_div);

        const text_span = document.createElement('span');
        text_span.textContent = text;
        text_div.appendChild(text_span);

        const time_stamp_div = document.createElement('div');
        time_stamp_div.classList.add('time_stamp');
        message_div.appendChild(time_stamp_div);

        const time_stamp_span = document.createElement('span');
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        time_stamp_span.textContent = `${hours}:${minutes}`;
        time_stamp_div.appendChild(time_stamp_span);

        // console.log(document.getElementById('messages'));
        const messagesContainer = document.getElementById('messages');

        if (messagesContainer) {
            const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 5;
            messagesContainer.appendChild(message_div);
            if (isAtBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }

    private clearInput(): void {
        const input = <HTMLInputElement>document.getElementById("messageInput");
        input.value = "";
    }

    public async makeCall(): Promise<void> {
        this.dataChannel = this.peerConnection.createDataChannel("chat"); 

        // Data channel on open
        this.dataChannel.onopen = () => {
            // console.log("DataChannel open (caller)");
            this.addMessage(MessageType.SYSTEM, "DataChannel open (caller)");
            this.dataChannel?.send("Hello from caller!");
        };

        // Data channel on message
        this.dataChannel.onmessage = (event) => {
            // console.log("Message from callee:", event.data);
            this.addMessage(MessageType.RECEIVER, event.data);
        };

        // Create Offer
        const offer = await this.peerConnection.createOffer();

        //
        await this.peerConnection.setLocalDescription(offer);

        // Share with other client
        // console.log(offer);
        this.ws.send(JSON.stringify({ offer: offer }));
    }
}

const rtc = new RTC('ws://127.0.0.1:8080');