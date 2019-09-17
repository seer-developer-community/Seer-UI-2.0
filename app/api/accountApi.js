import {Apis} from "seerjs-ws";
import moment from "moment";
import _ from "lodash";
import WebApi from "./WebApi";

class Api {

    lookupAccounts(startChar, limit) {
        return Apis.instance().db_api().exec("lookup_accounts", [
            startChar, limit
        ]);
    }

    getPlayerInfo = async function(oid){
        return await new Promise((resolve) => {
          Apis.instance().db_api().exec("get_player_info", [oid])
            .then((result) => {
              resolve(result);
            });
        });
    };

    getSeerRecordsByPlayer = async function(oid,assetId,roomStatus,trackSec,beginDate,limit){
        //账户OID、资产ID、房间状态代号、前溯秒数、起始时间、条数参数
        //status：1->opening;2->inputing;4->finished;7->opening+inputing+finished
        return await new Promise((resolve) => {
          Apis.instance().db_api().exec("get_seer_records_by_player", [oid,assetId,roomStatus,trackSec,beginDate,limit])
            .then((result) => {
              if(result && result.length > 0){
                let arrs = [];
                result.map(r=>arrs.push(...r[1]));
                resolve(arrs);
              }else{
                resolve();
              }
            });
        });
    };

    getAccountPredictionRecord = async function(oid){
      return await new Promise((resolve) => {
        let date = moment().format('YYYY-MM-DDTHH:mm:ss');
        this.getPlayerInfo(oid).then(res => {
          if (res) {
            let reqs = [];
            res.count_total.map(item => reqs.push(this.getSeerRecordsByPlayer(oid, item[0], 7, 2592000, date, 10/*item[1]*/)));

            Promise.all(reqs).then(result => {
              result = _.without(result || [], undefined);
              let resArrs = [];
              result.map(r => {
                resArrs.push(...r)
              });

              let roomIds = _.uniq(_.map(resArrs, 'room'));

              WebApi.getSeerRooms(roomIds,false).then(rooms=>{
                  rooms.map(rm=>{
                      resArrs.map(ra =>{
                        if(ra.room === rm.id){
                          ra.room = rm;
                        }
                      })
                  });
                  resolve(resArrs);
              }).catch(e=>{
                resolve([]);
              });

              return resArrs;
            });
          }else{
            resolve([]);
          }
        });
      });
    }

}

export default new Api();
