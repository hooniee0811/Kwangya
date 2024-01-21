import { N1Building } from "@/server/rooms/N1Building";
import { Message } from "@/types/Messages";
import { Client, Room } from 'colyseus.js';
import { Event, phaserEvents } from "../_events/event-center";
import { useRoomStore } from "../_stores/use-room";
import { IRoomData } from "@/types/Room";
import { useUserStore } from "../_stores/use-user";
import { IN1Building, IPlayer } from "@/types/N1Building";
import WebRTC from "../_web/WebRTC";

//network을 분리해야 플레이어가 다른 유저들의 움직임과 들어가고 나가는 것에 영향을 받지 않고 자유롭게 join하고 나가기위함이다
export default class Network {
    private client: Client
    private room?: Room<IN1Building>
    private lobby!: Room
    webRTC?: WebRTC
    mysessionId!: string

    constructor() {
        const protocol =  window.location.protocol.replace('http', 'ws')
        const endpoint =`${protocol}//${window.location.hostname}:2567`;
        this.client = new Client(endpoint)
        //network는 client가 요청해서 서버에 연결하면 바로 Lobbyroom에 연결하도록
        this.joinLobbyRoom().then(() => {
          const { setLobbyJoined } = useRoomStore((state) => state)
          setLobbyJoined(true)
        })
    
        phaserEvents.on(Event.MY_PLAYER_NAME_CHANGE, this.updatePlayerName, this)
        phaserEvents.on(Event.MY_PLAYER_TEXTURE_CHANGE, this.updatePlayer, this)
        phaserEvents.on(Event.PLAYER_DISCONNECTED, this.playerStreamDisconnect, this)
      }

    //서버와 연결하면 바로 room에 들어갈수 있는 로비룸으로 바로 연결
    async joinLobbyRoom() {
        this.lobby = await this.client.joinOrCreate('lobby')
        const { setAvailableRooms, addAvailableRooms, removeAvailableRooms } = useRoomStore((state) => state)
        this.lobby.onMessage('rooms', (rooms) => { setAvailableRooms(rooms) })

        this.lobby.onMessage('+', ([roomId, room]) => {
            addAvailableRooms(roomId, room)
        })

        this.lobby.onMessage('-', (roomId) => {
            removeAvailableRooms(roomId)
        })
    }

    async joinCustomById(roomId: string, password: string | null) {
        this.room = await this.client.joinById(roomId, { password })
        this.initialize()
    }

    async createCustom(roomData: IRoomData) {
        const { name, description, password, autoDispose } = roomData
        this.room = await this.client.create('custom', {
          name,
          description,
          password,
          autoDispose,
        })
        this.initialize()
    }

    //게임 맵 생성 전에 어떤 동작할때 어떤 listener를 이용해 감지할지 다 설정해놓기
    initialize() {
        if (!this.room) return

        
    }

    //채팅방에 유저가 더 들어올때 사용하는 이런 event listener랑 function 실행
    onChatMessageAdded(callback: (playerId: string, content: string) => void, context?: any) {
        phaserEvents.on(Event.UPDATE_DIALOG_BUBBLE, callback, context)
    }

    // item을 사용하는 또는 공유하는 플레이어가 추가될 경우 사용하는 listener랑 method
    onItemUserAdded(
        callback: (playerId: string, key: string, itemType: ItemType) => void,
        context?: any
    ) {
        phaserEvents.on(Event.ITEM_USER_ADDED, callback, context)
    }

    // item을 사용하던 플레이어가 없어질때 사용하는 Listener랑 method
    onItemUserRemoved(
        callback: (playerId: string, key: string, itemType: ItemType) => void,
        context?: any
    ) {
        phaserEvents.on(Event.ITEM_USER_REMOVED, callback, context)
    }

    // player가 맵에 조인할때 callback하기 위한 listener method
    onPlayerJoined(callback: (Player: IPlayer, key: string) => void, context?: any) {
        phaserEvents.on(Event.PLAYER_JOINED, callback, context)
    }

    // player가 다른 플레이어들과의 연결에서 나갈때 callback하기 위한 listener method
    onPlayerLeft(callback: (key: string) => void, context?: any) {
        phaserEvents.on(Event.PLAYER_LEFT, callback, context)
    }

    // player가 웹캠이랑 아직 연결안되었을때 callback하기 위한 listener method
    onMyPlayerReady(callback: (key: string) => void, context?: any) {
        phaserEvents.on(Event.MY_PLAYER_READY, callback, context)
    }

    // player 비디오가 연결되었을때 callback하기 위한 listener method
    onMyPlayerVideoConnected(callback: (key: string) => void, context?: any) {
        phaserEvents.on(Event.MY_PLAYER_VIDEO_CONNECTED, callback, context)
    }

    // player가 다른 플레이어랑 업데이트할때 listen해주기
    onPlayerUpdated(
        callback: (field: string, value: number | string, key: string) => void,
        context?: any
    ) {
        phaserEvents.on(Event.PLAYER_UPDATED, callback, context)
    }

    // 현재 플레이어의 position이랑 애니메이션 상태 업데이트 꾸준히 해주기
    updatePlayer(currentX: number, currentY: number, currentAnim: string) {
        this.room?.send(Message.UPDATE_PLAYER, { x: currentX, y: currentY, anim: currentAnim })
    }

    // 플레이어 이름 업데이트 해주기
    updatePlayerName(currentName: string) {
        this.room?.send(Message.UPDATE_PLAYER_NAME, { name: currentName })
    }

    // 서버랑 연결 될때
    readyToConnect() {
        this.room?.send(Message.READY_TO_CONNECT)
        phaserEvents.emit(Event.MY_PLAYER_READY)
    }

    // 비디오 연결되어있을때
    videoConnected() {
        this.room?.send(Message.VIDEO_CONNECTED)
        phaserEvents.emit(Event.MY_PLAYER_VIDEO_CONNECTED)
    }

    // 다른 플레이어의 웹캠이랑 연결 끊고싶을때
    playerStreamDisconnect(id: string) {
        this.room?.send(Message.DISCONNECT_STREAM, { clientId: id })
        this.webRTC?.deleteVideoStream(id)
    }

    connectToComputer(id: string) {
        this.room?.send(Message.CONNECT_TO_COMPUTER, { computerId: id })
    }

    disconnectFromComputer(id: string) {
        this.room?.send(Message.DISCONNECT_FROM_COMPUTER, { computerId: id })
    }

    connectToWhiteboard(id: string) {
        this.room?.send(Message.CONNECT_TO_WHITEBOARD, { whiteboardId: id })
    }

    disconnectFromWhiteboard(id: string) {
        this.room?.send(Message.DISCONNECT_FROM_WHITEBOARD, { whiteboardId: id })
    }

    onStopScreenShare(id: string) {
        this.room?.send(Message.STOP_SCREEN_SHARE, { computerId: id })
    }

    addChatMessage(content: string) {
        this.room?.send(Message.ADD_CHAT_MESSAGE, { content: content })
    }
}