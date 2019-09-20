import {Apis} from "seerjs-ws";
import AccountApi from "api/accountApi";
import _ from "lodash";


const searchAccount = async function(key,limit){
  return await new Promise((resolve) => {
    AccountApi.lookupAccounts(key, limit)
      .then(result => {
          if(!result){
            resolve([]);
          }else{
            let resArr = result.map(item=>{
                return {
                  type:"account",
                  text:item[0],
                  url:"/account/" + item[0]
                };
            });
            resolve(resArr);
          }
      });
  });
};

const searchBlock = async function(key){
  return await new Promise((resolve) => {
    if (!/^\d+$/.test(key)) {
        resolve();
        return;
    }

    Apis.instance().db_api().exec("get_block", [key])
      .then((result) => {
        if (!result) {
          resolve();
        }else{
          resolve({
            type:"block",
            text:"#" + key,
            url:"/block/" + key
          });
        }
      });
  });
};

const searchAssets = async function(key,limit){
  return await new Promise((resolve) => {
    Apis.instance().db_api().exec("list_assets", [key,limit])
      .then((result) => {
        if(!result){
          resolve([]);
        }else{
          let resArr = result.map(item=>{
            return {
              type:"assets",
              text:item.symbol,
              url:"/explorer/asset/" + item.symbol
            };
          });
          resolve(resArr);
        }
      });
  });
};

const searchTransaction = async function(key){
  return await new Promise((resolve) => {
    Apis.instance().db_api().exec("get_transaction_by_txid", [key])
      .then((result) => {
        if (result) {
          resolve({
            type:"transaction",
            text:result.txid,
            url:"/explorer/tx/" + result.txid
          });
        }else{
          resolve();
        }
      }).catch(err => {
        resolve();
      });
  });
};

const search = (key) => {
  return Promise.all([searchAssets(key,10),searchAccount(key,10),searchBlock(key),searchTransaction(key)])
    .then((result)=>{
        let res = [];
        if(result[0] && result[0].length > 0){
            res.push(...result[0]);
        }

        if(result[1] && result[1].length > 0){
            res.push(...result[1]);
        }

        if(!!result[2]){
          res.push(result[2]);
        }

        if(!!result[3]){
            res.push(result[3]);
        }
        return res;
  });
};

export default {
    search
}
