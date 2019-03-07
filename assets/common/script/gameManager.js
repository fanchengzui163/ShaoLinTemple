var mvs = require("Matchvs");
var GLB = require("Glb");

cc.Class({
    extends: cc.Component,
    blockInput() {
        Game.GameManager.getComponent(cc.BlockInputEvents).enabled = true;
        setTimeout(function() {
            Game.GameManager.node.getComponent(cc.BlockInputEvents).enabled = false;
        }, 1000);
    },
    onLoad() {
        Game.GameManager = this;
        cc.game.addPersistRootNode(this.node);
        clientEvent.init();
        dataFunc.loadConfigs();
        cc.view.enableAutoFullScreen(false);
        clientEvent.on(clientEvent.eventType.gameOver, this.gameOver, this);
        clientEvent.on(clientEvent.eventType.leaveRoomNotify, this.leaveRoom, this);
        this.network = window.network;
        this.network.chooseNetworkMode();
        this.getRankDataListener();
        this.findPlayerByAccountListener();
        // try {
        //     wx.login({
        //         success: function() {
        //             wx.getUserInfo({
        //                 fail: function(res) {
        //                     // iOS 和 Android 对于拒绝授权的回调 errMsg 没有统一，需要做一下兼容处理
        //                     if (res.errMsg.indexOf('auth deny') > -1 || res.errMsg.indexOf('auth denied') > -1) {
        //                         // 处理用户拒绝授权的情况
        //                         console.log("fail");
        //                     }
        //                 },
        //                 success: function(res) {
        //                     Game.GameManager.nickName = res.userInfo.nickName;
        //                     Game.GameManager.avatarUrl = res.userInfo.avatarUrl;
        //                     console.log('success', Game.GameManager.nickName);
        //                 }
        //             });
        //         }
        //     })
        // } catch (e) {
        //
        // }
    },

    leaveRoom: function(data) {
        // 离开房间--
        if (this.gameState === GameState.Play) {
            if (GLB.userInfo.id !== data.leaveRoomInfo.userId) {
                GLB.isRoomOwner = true;
                // var gamePanel = uiFunc.findUI("uiGamePanel");
                // if (gamePanel) {
                //     var gamePanelScript = gamePanel.getComponent("uiGamePanel");
                //     gamePanelScript.otherScore = 0;
                //     this.gameOver();
                // }
            }
            else {
                Game.GameManager.gameState = GameState.Over;
            }
        }
    },

    gameOver: function() {
        var gamePanel = uiFunc.findUI("uiGamePanel");
        if (gamePanel && Game.GameManager.gameState !== GameState.Over) {
            Game.GameManager.gameState = GameState.Over;
            clientEvent.dispatch(clientEvent.eventType.gameOver);
            setTimeout(function() {
                if (cc.Canvas.instance.designResolution.height > cc.Canvas.instance.designResolution.width) {
                    uiFunc.openUI("uiVsResultVer");
                } else {
                    uiFunc.openUI("uiVsResult");
                }
            }.bind(this), 1500);
        }
    },

    matchVsInit: function() {
        mvs.response.initResponse = this.initResponse.bind(this);
        mvs.response.errorResponse = this.errorResponse.bind(this);
        mvs.response.joinRoomResponse = this.joinRoomResponse.bind(this);
        mvs.response.joinRoomNotify = this.joinRoomNotify.bind(this);
        mvs.response.leaveRoomResponse = this.leaveRoomResponse.bind(this);
        mvs.response.leaveRoomNotify = this.leaveRoomNotify.bind(this);
        mvs.response.joinOverResponse = this.joinOverResponse.bind(this);
        mvs.response.createRoomResponse = this.createRoomResponse.bind(this);
        mvs.response.getRoomListResponse = this.getRoomListResponse.bind(this);
        mvs.response.getRoomDetailResponse = this.getRoomDetailResponse.bind(this);
        mvs.response.getRoomListExResponse = this.getRoomListExResponse.bind(this);
        mvs.response.kickPlayerResponse = this.kickPlayerResponse.bind(this);
        mvs.response.kickPlayerNotify = this.kickPlayerNotify.bind(this);
        mvs.response.registerUserResponse = this.registerUserResponse.bind(this);
        mvs.response.loginResponse = this.loginResponse.bind(this); // 用户登录之后的回调
        mvs.response.logoutResponse = this.logoutResponse.bind(this); // 用户登录之后的回调
        mvs.response.sendEventNotify = this.sendEventNotify.bind(this);
        mvs.response.networkStateNotify = this.networkStateNotify.bind(this);

        var result = mvs.engine.init(mvs.response, GLB.channel, GLB.platform, GLB.gameId,
            GLB.appKey,GLB.gameVersion);
        if (result !== 0) {
            console.log('初始化失败,错误码:' + result);
        }
        Game.GameManager.blockInput();

    },

    networkStateNotify: function(netNotify) {
        if (netNotify.userID !== GLB.userInfo.id) {
            GLB.isRoomOwner = true;
        }
        console.log(netNotify);
        if(netNotify.state === 1) {
            clientEvent.dispatch(clientEvent.eventType.leaveRoomMedNotify, netNotify);
        }
    },

    kickPlayerNotify: function(kickPlayerNotify) {
        var data = {
            kickPlayerNotify: kickPlayerNotify
        }
        clientEvent.dispatch(clientEvent.eventType.kickPlayerNotify, data);
    },

    kickPlayerResponse: function(kickPlayerRsp) {
        if (kickPlayerRsp.status !== 200) {
            console.log("失败kickPlayerRsp:" + kickPlayerRsp);
            return;
        }
        var data = {
            kickPlayerRsp: kickPlayerRsp
        }
        clientEvent.dispatch(clientEvent.eventType.kickPlayerResponse, data);
    },

    getRoomListExResponse: function(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 rsp:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        }
        clientEvent.dispatch(clientEvent.eventType.getRoomListExResponse, data);
    },

    getRoomDetailResponse: function(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 rsp:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        }
        clientEvent.dispatch(clientEvent.eventType.getRoomDetailResponse, data);
    },

    getRoomListResponse: function(status, roomInfos) {
        if (status !== 200) {
            console.log("失败 status:" + status);
            return;
        }
        var data = {
            status: status,
            roomInfos: roomInfos
        }
        clientEvent.dispatch(clientEvent.eventType.getRoomListResponse, data);
    },

    createRoomResponse: function(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 createRoomResponse:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        }
        clientEvent.dispatch(clientEvent.eventType.createRoomResponse, data);
    },

    joinOverResponse: function(joinOverRsp) {
        if (joinOverRsp.status !== 200) {
            console.log("失败 joinOverRsp:" + joinOverRsp);
            return;
        }
        var data = {
            joinOverRsp: joinOverRsp
        }
        clientEvent.dispatch(clientEvent.eventType.joinOverResponse, data);
    },

    joinRoomResponse: function(status, roomUserInfoList, roomInfo) {
        if (status !== 200) {
            console.log("失败 joinRoomResponse:" + status);
            return;
        }
        var data = {
            status: status,
            roomUserInfoList: roomUserInfoList,
            roomInfo: roomInfo
        }
        clientEvent.dispatch(clientEvent.eventType.joinRoomResponse, data);
    },

    joinRoomNotify: function(roomUserInfo) {
        var data = {
            roomUserInfo: roomUserInfo
        }
        clientEvent.dispatch(clientEvent.eventType.joinRoomNotify, data);
    },

    leaveRoomResponse: function(leaveRoomRsp) {
        if (leaveRoomRsp.status !== 200) {
            console.log("失败 leaveRoomRsp:" + leaveRoomRsp);
            return;
        }
        var data = {
            leaveRoomRsp: leaveRoomRsp
        }
        clientEvent.dispatch(clientEvent.eventType.leaveRoomResponse, data);
    },

    leaveRoomNotify: function(leaveRoomInfo) {
        var data = {
            leaveRoomInfo: leaveRoomInfo
        }
        clientEvent.dispatch(clientEvent.eventType.leaveRoomNotify, data);
    },

    logoutResponse: function(status) {
        Game.GameManager.network.disconnect();
        cc.game.removePersistRootNode(this.node);
        cc.director.loadScene('lobby');
    },

    errorResponse: function(error, msg) {
        if (error === 1001 || error === 0) {
            uiFunc.openUI("uiTip", function(obj) {
                var uiTip = obj.getComponent("uiTip");
                if (uiTip) {
                    uiTip.setData("网络断开连接");
                }
            });
            setTimeout(function() {
                mvs.engine.logout("");
                cc.game.removePersistRootNode(this.node);
                cc.director.loadScene('lobby');
            }.bind(this), 2500);
        }
        console.log("错误信息：" + error);
        console.log("错误信息：" + msg);
    },

    initResponse: function() {
        console.log('初始化成功，开始注册用户');
        var result = mvs.engine.registerUser();
        if (result !== 0) {
            console.log('注册用户失败，错误码:' + result);
        } else {
            console.log('注册用户成功');
        }
    },

    registerUserResponse: function(userInfo) {
        var deviceId = 'abcdef';
        var gatewayId = 0;
        GLB.userInfo = userInfo;

        console.log('开始登录,用户Id:' + userInfo.id)

        var result = mvs.engine.login(
            userInfo.id, userInfo.token,
            deviceId
        );
        if (result !== 0) {
            console.log('登录失败,错误码:' + result);
        }
    },

    loginResponse: function(info) {
        if (info.status !== 200) {
            console.log('登录失败,异步回调错误码:' + info.status);
        } else {
            console.log('登录成功');
            this.lobbyShow();
        }
    },

    lobbyShow: function() {
        this.gameState = GameState.None;
        if (cc.Canvas.instance.designResolution.height > cc.Canvas.instance.designResolution.width) {
            uiFunc.openUI("uiLobbyPanelVer");
        } else {
            uiFunc.openUI("uiLobbyPanel");
        }
    },

    // 收到的消息
    sendEventNotify: function(info) {
        console.log(info)
        var cpProto = JSON.parse(info.cpProto);
        if (info.cpProto.indexOf(GLB.GAME_START_EVENT) >= 0) {
            GLB.playerUserIds = [GLB.userInfo.id]
            var remoteUserIds = JSON.parse(info.cpProto).userIds;
            remoteUserIds.forEach(function(id) {
                if (GLB.userInfo.id !== id) {
                    GLB.playerUserIds.push(id);
                }
            });
            this.startGame();
        }


        if (info.cpProto.indexOf(GLB.PLAYER_HIT) >= 0) {
            var param = {
                ID: (info.srcUserId == GLB.userInfo.id) ? 0 : 1
            }
            clientEvent.dispatch(clientEvent.eventType.hitEvent, param);
            // Game.PlayerManager.rival.PLAYER_HIT();
            if (info.srcUserId == GLB.userInfo.id) {
                clientEvent.dispatch(clientEvent.eventType.showBlueAddNum);
            } else {
                clientEvent.dispatch(clientEvent.eventType.showAddRedNum);
            }

        }
        if (info.cpProto.indexOf(GLB.STAND_UP) >= 0) {
            var param = {
                ID: (info.srcUserId == GLB.userInfo.id) ? 0 : 1
            }
            clientEvent.dispatch(clientEvent.eventType.standUpEvent, param);

        }
        if (info.cpProto.indexOf(GLB.COMPLACENT) >= 0) {
            var param = {
                ID: (info.srcUserId == GLB.userInfo.id) ? 0 : 1
            }
            clientEvent.dispatch(clientEvent.eventType.complacentEvent, param);
            if (info.srcUserId == GLB.userInfo.id) {
                clientEvent.dispatch(clientEvent.eventType.showReduceRedNum);
            } else {
                clientEvent.dispatch(clientEvent.eventType.showReduceBlueNum);
            }
        }
        if (info.cpProto.indexOf(GLB.SIT_DOWN) >= 0) {
            clientEvent.dispatch(clientEvent.eventType.sitDown);
        }
        if (info.cpProto.indexOf(GLB.GAME_OVER_EVENT) >= 0) {
            this.gameOver();
        }
        if (info.cpProto.indexOf(GLB.APPEAR_BESOM) >= 0) {
            clientEvent.dispatch(clientEvent.eventType.appearBesom);

        }
        if (info.cpProto.indexOf(GLB.APPEAR_BROTHER) >= 0) {
            clientEvent.dispatch(clientEvent.eventType.appearBrother);
        }
        if (info.cpProto.indexOf(GLB.APPEAR_TEACHER) >= 0) {
            clientEvent.dispatch(clientEvent.eventType.appearTeacher);
        }
        if (info.cpProto.indexOf(GLB.HALF_OPEN_DOOR) >= 0) {
            clientEvent.dispatch(clientEvent.eventType.halfOpenDoor);
        }

        if (info.cpProto.indexOf(GLB.READY) >= 0) {
            this.readyCnt++;
            if (GLB.isRoomOwner && this.readyCnt >= GLB.playerUserIds.length) {
                this.sendRoundStartMsg();
            }
        }

        if (info.cpProto.indexOf(GLB.ROUND_START) >= 0) {
            setTimeout(function() {
                Game.GameManager.gameState = GameState.Play;
            }.bind(this), 2000);
            clientEvent.dispatch(clientEvent.eventType.roundStart);
        }
    },

    sendReadyMsg: function() {
        var msg = {action: GLB.READY};
        this.sendEventEx(msg);
    },

    sendRoundStartMsg: function() {
        var msg = {action: GLB.ROUND_START};
        this.sendEventEx(msg);
    },

    sendEventEx: function(msg) {
        var result = mvs.engine.sendEventEx(0, JSON.stringify(msg), 0, GLB.playerUserIds);
        if (result.result !== 0) {
            console.log(msg.action, result.result);
        }
    },

    sendEvent: function(msg) {
        var result = mvs.engine.sendEvent(JSON.stringify(msg));
        if (result.result !== 0) {
            console.log(msg.action, result.result);
        }
    },

    startGame: function() {
        this.readyCnt = 0;
        cc.director.loadScene('game', function() {
            uiFunc.openUI("uiGamePanel", function() {
                this.sendReadyMsg();
            }.bind(this));
        }.bind(this));
    },

    getRankDataListener: function() {
        this.network.on("connector.rankHandler.getRankData", function(recvMsg) {
            uiFunc.openUI("uiRankPanelVer", function(obj) {
                var uiRankPanel = obj.getComponent("uiRankPanel");
                uiRankPanel.setData(recvMsg.rankArray);
            });
        }.bind(this));
    },

    findPlayerByAccountListener: function() {
        this.network.on("connector.entryHandler.findPlayerByAccount", function(recvMsg) {
            clientEvent.dispatch(clientEvent.eventType.playerAccountGet, recvMsg);
        });
    },

    loginServer: function() {
        if (!this.network.isConnected()) {
            this.network.connect(GLB.IP, GLB.PORT, function() {
                    this.network.send("connector.entryHandler.login", {
                        "account": GLB.userInfo.id + "",
                        "channel": "0",
                        "userName": Game.GameManager.nickName ? Game.GameManager.nickName : GLB.userInfo.id + "",
                        "headIcon": Game.GameManager.avatarUrl ? Game.GameManager.avatarUrl : "-"
                    });
                    setTimeout(function() {
                        this.network.send("connector.rankHandler.updateScore", {
                            "account": GLB.userInfo.id + "",
                            "game": "game1"
                        });
                    }.bind(this), 500);
                }.bind(this)
            );
        } else {
            this.network.send("connector.rankHandler.updateScore", {
                "account": GLB.userInfo.id + "",
                "game": "game1"
            });
        }
    },

    userInfoReq: function(userId) {
        if (!Game.GameManager.network.isConnected()) {
            Game.GameManager.network.connect(GLB.IP, GLB.PORT, function() {
                    Game.GameManager.network.send("connector.entryHandler.login", {
                        "account": GLB.userInfo.id + "",
                        "channel": "0",
                        "userName": Game.GameManager.nickName ? Game.GameManager.nickName : GLB.userInfo.id + "",
                        "headIcon": Game.GameManager.avatarUrl ? Game.GameManager.avatarUrl : "-"
                    });
                    setTimeout(function() {
                        Game.GameManager.network.send("connector.entryHandler.findPlayerByAccount", {
                            "account": userId + "",
                        });
                    }, 200);
                }
            );
        } else {
            Game.GameManager.network.send("connector.entryHandler.findPlayerByAccount", {
                "account": userId + "",
            });
        }
    },

    onDestroy() {
        clientEvent.off(clientEvent.eventType.gameOver, this.gameOver, this);
        clientEvent.off(clientEvent.eventType.leaveRoomNotify, this.leaveRoom, this);
    }
});
