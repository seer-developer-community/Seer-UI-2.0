/**
 * Created by Fants on 2019/9/11.
 */
import {Apis} from "seerjs-ws";
import {websiteAPIs} from "api/apiConfig";
import _ from "lodash";

const getSeerRoom = async function(roomId,statusFilter=[]){
    return await new Promise((resolve) =>
    {
        Apis.instance().db_api().exec("get_seer_room", [roomId, 0, 0]).then(room => {
            if(room){
              if(statusFilter && statusFilter.length > 0){
                if(statusFilter.indexOf(room.status) !== -1) {
                  resolve(room);
                }else{
                  resolve();
                }
              }else{
                resolve(room);
              }
            }else{
                resolve();
            }
        });
    });
}

const getSeerRooms = async function(roomIds = [],statusFilter) {
    let getSeerReqs = [];
    roomIds.map(id => getSeerReqs.push(getSeerRoom(id,statusFilter)));

    return Promise.all(getSeerReqs).then(result=>{
        return _.without(result || [], undefined);
    });
}

const getSeerRoomRecords = async function(roomId,limit){
    return await new Promise((resolve) =>
    {
        Apis.instance().db_api().exec("get_seer_room_records", [roomId, "2.18.999999999999", limit]).then(results => {
            resolve(results ? results : []);
        },err=>{
          resolve([]);
        });
    });
}

const getSeersRoomRecords = async function(roomIds = [],limit) {
    let reqs = [];
    roomIds.map(id => reqs.push(getSeerRoomRecords(id,limit)));

    return Promise.all(reqs).then(result=>{
        result = _.filter(result || [], o=>o.length>0);
        let mapping = {};
        result.map(a=>{
            mapping = Object.assign(mapping, _.groupBy(a,"room"))
        });
        return mapping;
    });
};


const getHousesSeerRooms = async function(houseIds=[],excludedRooms=[],extraRooms=[],statusFilter=[]) {
    return await new Promise((resolve) => {
        if(!houseIds || houseIds.length === 0){
            resolve([]);
            return;
        }

        Apis.instance().db_api().exec("get_houses", [houseIds]).then(houses => {
          let roomIds = [];
          houses.map(h=>{
            roomIds.push(...h.rooms)
          });
          //
          roomIds.push(...extraRooms);
          roomIds = _.difference(roomIds,excludedRooms);
          roomIds = _.uniq(roomIds);
          //
          getSeerRooms(roomIds,statusFilter).then((rooms) => {
                resolve(rooms);
          });
        });
    });
};

/**
 * load all seer room
 * @param option.onlyLoadWhiteListHouses
 * @param option.housesWhiteList
 * @param option.excludedHouses
 * @param option.excludedRooms
 * @param option.extraRooms
 * @param option.statusFilter
 * @returns {Promise<void>}
 */
const getAllSeerRoom = async function(option={
    onlyLoadWhiteListHouses:false,
    housesWhiteList:[],
    excludedHouses:[],
    excludedRooms:[],
    extraRooms:[],
    statusFilter:["opening"]
}) {
    option.excludedRooms = option.excludedRooms || [];
    option.excludedHouses = option.excludedHouses || [];
    option.housesWhiteList = option.housesWhiteList || [];
    option.extraRooms = option.extraRooms || [];
    option.statusFilter = option.statusFilter || ["opening"];

    if(option.onlyLoadWhiteListHouses){
      return await new Promise((resolve) => {
        let houseIds = _.difference(option.housesWhiteList,option.excludedHouses);
        getHousesSeerRooms(houseIds, option.excludedRooms,option.extraRooms,option.statusFilter).then(rooms => {
            resolve(rooms);
        });
      });
    }else{

      return await new Promise((resolve) => {
        Apis.instance().db_api().exec("lookup_house_accounts", ["", 1000]).then((results) => {
          let ids = results.map(r => r[1]);

          ids = _.difference(ids,option.excludedHouses);
          getHousesSeerRooms(ids, option.excludedRooms,option.extraRooms,option.statusFilter).then(rooms => {
            resolve(rooms);
          });
        });
      });
    }
};


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
    getBlockRecords,
    getSeerRoomRecords,
    getSeersRoomRecords,
    getAllSeerRoom
}