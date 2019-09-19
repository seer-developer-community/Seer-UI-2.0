/**
 * Created by Fants on 2019/9/11.
 */
import {Apis} from "seerjs-ws";
import {websiteAPIs} from "api/apiConfig";
import _ from "lodash";

const getSeerRoom = async function(roomId,onlyOpen=true){
    return await new Promise((resolve) =>
    {
        Apis.instance().db_api().exec("get_seer_room", [roomId, 0, 0]).then(room => {
            if(room){
                if(onlyOpen && (room.status === "finished" || room.status === "closed" || room.status === "inputing")){
                    resolve()
                }else{
                  resolve(room);
                }
            }else{
                resolve();
            }
        });
    });
}

const getSeerRooms = async function(roomIds = [],onlyOpen) {
    let getSeerReqs = [];
    roomIds.map(id => getSeerReqs.push(getSeerRoom(id,onlyOpen)));

    return Promise.all(getSeerReqs).then(result=>{
        return _.without(result || [], undefined);
    });
}


const getBlockRecords = function(limit,codeNumber){
    return new Promise((resolve)=>{
        fetch(websiteAPIs.HISTORY_LOG(limit,codeNumber), {
            method:"post",
            mode:"cors"
        }).then((response) => response.json()
            .then( json => {
                if(json){
                    let list = [];
                    let needLoadRoomids = [];

                    if(json.result && json.result.length > 0){

                        json.result.map(e=> {
                            e.operations = JSON.parse(e.operations);
                            e.operationResults = JSON.parse(e.operationResults);

                            if (e.type === 50){
                                e.operations[1].input_desc = [];
                                if (needLoadRoomids.indexOf(e.operations[1].room) === -1) {
                                    needLoadRoomids.push(e.operations[1].room);
                                }
                            }

                            list.push(e);
                        })
                    }

                    if(needLoadRoomids.length > 0){
                        getSeerRooms(needLoadRoomids).then((rooms) => {
                            rooms.map(room=>{

                                list.map(item=>{
                                    if(item.type === 50 && item.operations[1].room === room.id){
                                        item.operations[1].input_desc[0] = room.running_option.selection_description[item.operations[1].input[0]];
                                    }
                                });
                            });

                            resolve(list);
                        });
                    }else{
                        resolve(list);
                    }
                }
            })
        );
    });
}


export default {
    getSeerRoom,
    getSeerRooms,
    getBlockRecords
}