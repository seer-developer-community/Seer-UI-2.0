import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import SeerActions from "../../actions/SeerActions";
import {ChainStore} from "seerjs/es";
import ReactEcharts from 'echarts-for-react';
var Apis =  require("seerjs-ws").Apis;
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import FormattedAsset from "../Utility/FormattedAsset";
import {Tabs, Tab} from "../Utility/Tabs";

import AccountStore from "../../stores/AccountStore";
import { Asset } from "../../lib/common/MarketClasses";
import RoomCard from "./RoomCard";
import { websiteAPIs } from "../../api/apiConfig";
import WalletApi from "../../api/WalletApi";
import Operation from "../Blockchain/Operation";
import WebApi from "api/WebApi"
var moment = require('moment');

let roomType =
{
    0:"PVD",
    1:"PVP",
    2:"Advanced"
};
let chartColor = ['#FA9361', '#FBD876','#ff715e','#ff715e','#b5c334','#9bca63','#60c0dd','#e87c25','#fad860'];

class RoomParticipate extends React.Component {

    static propTypes = {
        room: ChainTypes.ChainObject.isRequired,
    };

    static defaultProps = {
        room: "props.params.room_id"
    }

    constructor(props) {
        super(props);
        this.state = {
            checked_item: 0,
            amount: null,
            room: props.room.toJS(),
            account: null,
            asset:null,
            precision:null,
            historyList:[]
            //oracles:[]
        };
    }

    componentWillReceiveProps(next) {

    }

    componentWillMount() {
        Apis.instance().db_api().exec("get_seer_room", [this.props.params.room_id, 0, 500]).then(r => {
            this.setState({room: r});
        });

        Apis.instance().db_api().exec("get_assets",[[this.state.room.option.accept_asset]]).then(objs => {
            var ret = [];
            objs.forEach(function(item,index){
                ret.push(item);
            });
            let symbol = ret.length>0 ? ret[0].symbol: "";

            let precision = ret.length>0 ? Math.pow(10,parseInt(ret[0].precision)): 1;
            this.setState({asset:symbol,precision:precision});
        });
/*
        if(this.state.room.option.allowed_oracles.length>0)
        {
            Apis.instance().db_api().exec("get_oracles", [this.state.room.option.allowed_oracles]).then(houses => {
                var ret = [];
                houses.forEach(function(item,index){
                    ret.push(item.owner);
                });
                this.setState({oracles:ret});
            });
        }
        */
        this._getHistory.bind(this)();
        this.getHistoryTimer = setInterval(
          () => this._getHistory.bind(this)(),
          1000 * 60
        );
    }

    componentWillUnmount(){
      clearInterval(this.getHistoryTimer)
    }

    _getHistory(){
        WebApi.getSeerRoomRecords(this.state.room.id,20).then(records=>{
           this.setState({historyList: records})
        });
    }

    onSubmit() {
        let obj = ChainStore.getAccount(AccountStore.getState().currentAccount);
        if (!obj) return;
        let id = obj.get("id");
        let args = {
            issuer: id,
            room: this.state.room.id,
            type: 0,
            input: [this.state.checked_item],
            input1: [],
            input2: [],
            amount: parseInt(this.state.amount * this.state.precision)
        };
        SeerActions.participate(args);
    }

    handleInputChange(idx, event) {
        const target = event.target;
        const checked = target.checked;
        const value = parseInt(idx);

        this.setState({checked_item: parseInt(event.currentTarget.value)});
    }

    changeAmount(e) {
        let amount = e.target.value
        if (this.state.room.room_type>0 && amount<0){
            this.setState({amount: 0});
        }
        else {
            this.setState({amount: amount});
        }
    }

    renderDescription()
    {
        let {room} = this.state;

        if(!room.option){
            return null;
        }

        let filter =  (room.option.filter? (
            <td>
                <table className="table" style={{width: "100%"}}>
                    <thead>
                    <tr>
                        <th><Translate content="seer.room.reputation"/></th>
                        <th><Translate content="seer.room.guaranty"/></th>
                        <th><Translate content="seer.room.volume"/></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{room.option.filter.reputation}</td>
                        <td><FormattedAsset amount={room.option.filter.guaranty} asset={"1.3.0"}/></td>
                        <td>{room.option.filter.volume}</td>
                    </tr>
                    </tbody>
                </table>
            </td>
        ) :
            <td>Not Set</td>);


/*
        let oracles = this.state.oracles.length>0?this.state.oracles
            .map(oracle => {
                return (<span key={oracle.id} style={{marginRight: "20px"}}><LinkToAccountById  account={oracle}  /></span>);
            }):
            <span>Not Set</span>;
*/
        let details = null;
        let L = null;
        let total_shares = null;

        if (this.state.room.status && (this.state.room.status !="closed")) {
            total_shares = (
                <tr>
                    <td><Translate content="seer.room.total_shares"/></td>
                    <td><FormattedAsset amount={this.state.room.running_option.total_shares} asset={room.option.accept_asset}/></td>
                </tr>
            );

            let idx = 0;
            if (this.state.room.room_type == 0) {
                L = (
                    <tr>
                        <td><Translate content="seer.room.L"/></td>
                        <td>{this.state.room.running_option.lmsr.L/this.state.precision}</td>
                    </tr>
                );

                details = (
                    this.state.room.running_option.selection_description.map(c => {
                        let dom = (
                            <tr key={c}>
                                <td>{c}</td>
                                <td>{this.state.room.running_option.player_count[idx]}</td>
                                <td>{this.state.room.running_option.lmsr_running.items[idx]/this.state.precision} <Translate content="seer.room.part"/></td>
                            </tr>
                        );
                        idx++;
                        return dom;
                    })
                )

            }
            else if (this.state.room.room_type == 1) {
                details = (
                    this.state.room.running_option.selection_description.map(c => {
                        let dom = (
                            <tr key={c}>
                                <td>{c}</td>
                                <td>{this.state.room.running_option.player_count[idx]}</td>
                                <td><FormattedAsset amount={this.state.room.running_option.pvp_running.total_participate[idx]} asset={room.option.accept_asset}/></td>
                            </tr>
                        );
                        idx++;
                        return dom;
                    })
                )
            }
            else if (this.state.room.room_type == 2) {
                L = (
                    <tr>
                        <td><Translate content="seer.room.pool"/></td>
                        <td><FormattedAsset amount={this.state.room.running_option.advanced.pool} asset={room.option.accept_asset}/></td>
                    </tr>
                );

                details = (
                    this.state.room.running_option.selection_description.map(c => {
                        let dom = (
                            <tr key={c}>
                                <td>{c}</td>
                                <td>{this.state.room.running_option.player_count[idx]}</td>
                                <td><FormattedAsset amount={this.state.room.running_option.advanced_running.total_participate[idx][0]} asset={room.option.accept_asset}/></td>
                            </tr>
                        );
                        idx++;
                        return dom;
                    })
                )
            }
        };

        return (<div>
                <table className="table">
                    <tbody>
                    <tr>
                        <td style={{width: "130px"}}><Translate content="seer.house.owner"/></td>
                        <td><LinkToAccountById account={room.owner}/></td>
                    </tr>
                    <tr>
                        <td><Translate content="seer.oracle.description"/></td>
                        <td>{room.description}</td>
                    </tr>

                    <tr>
                        <td><Translate content="seer.room.label"/></td>
                        <td>{room.label.join(",")}</td>
                    </tr>


                    <tr>
                        <td><Translate content="seer.oracle.script"/></td>
                        <td>{room.script}</td>
                    </tr>

                    <tr>
                        <td><Translate content="seer.room.type"/></td>
                        <td>{roomType[room.room_type]}</td>
                    </tr>

                    <tr>
                        <td><Translate content="seer.room.status"/></td>
                        <td>{room.status}</td>
                    </tr>
                    <tr>
                        <td><Translate content="seer.room.result_owner_percent"/></td>
                        <td>{room.option.result_owner_percent/100}%</td>
                    </tr>
                    <tr>
                        <td><Translate content="seer.room.reward_per_oracle"/></td>
                        <td>{room.option.reward_per_oracle / 100000} SEER</td>
                    </tr>
                    <tr>
                        <td><Translate content="seer.room.accept_asset"/></td>
                        <td><LinkToAssetById asset={room.option.accept_asset}/></td>
                    </tr>
                    <tr>
                        <td><Translate content="seer.room.min"/></td>
                        <td>{room.option.minimum/this.state.precision}</td>
                    </tr>
                    <tr>
                        <td><Translate content="seer.room.max"/></td>
                        <td>{room.option.maximum/this.state.precision}</td>
                    </tr>
                    <tr>
                        <td><Translate content="account.votes.start"/></td>
                        <td>{room.option.start}</td>
                    </tr>
                    <tr>
                        <td><Translate content="account.votes.end"/></td>
                        <td>{room.option.stop}</td>
                    </tr>
                    <tr>
                        <td><Translate content="seer.room.input_duration_secs"/></td>
                        <td>{room.option.input_duration_secs/60}</td>
                    </tr>
                    {L}
                    {total_shares}
                    <tr>
                        <td><Translate content="seer.room.filter"/></td>
                        {filter}
                    </tr>
                    <tr>
                        <td><Translate content="seer.room.selections"/></td>
                        <td>
                            <table className="table">
                                <thead>
                                <tr>
                                    <th><Translate content="seer.room.selection_description"/></th>
                                    <th><Translate content="seer.room.participators"/></th>
                                    <th><Translate content="seer.room.amount"/></th>
                                </tr>
                                </thead>
                                <tbody>
                                {details}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    _getTotal() {
      let { room } = this.state;

      if (room.room_type == 0 && room.running_option.lmsr_running) {
        let orgin0 = 0;
        for (var i = 0; i < room.running_option.lmsr_running.items.length; i++) {
          orgin0 = orgin0 + Math.exp(room.running_option.lmsr_running.items[i] / room.running_option.lmsr.L);
        }

        let orgin1 = 0;
        for (var j = 0; j < room.running_option.lmsr_running.items.length; j++) {
          if (j == this.state.checked_item) {
            orgin1 = orgin1 + Math.exp((room.running_option.lmsr_running.items[j] / room.running_option.lmsr.L) + (parseInt(this.state.amount * this.state.precision) / room.running_option.lmsr.L));
          }
          else {
            orgin1 = orgin1 + Math.exp(room.running_option.lmsr_running.items[j] / room.running_option.lmsr.L);
          }
        }

        return parseInt(room.running_option.lmsr.L * (Math.log(orgin1) - Math.log(orgin0)));
      }else{
        return parseInt(this.state.amount);
      }
    }

    renderRoomInfo(){
        let { room } = this.state;

      let details = null;
      let L = null;
      let total_shares = null;

      if (this.state.room.status && (this.state.room.status !="closed")) {
        total_shares = (
          <td width="33.33333%">
              <Translate content="seer.room.total_shares"/>：<FormattedAsset amount={this.state.room.running_option.total_shares} asset={room.option.accept_asset}/>
          </td>
        );

        let idx = 0;
        if (this.state.room.room_type == 0) {
          L = (
            <td width="33.33333%">
              <Translate content="seer.room.L"/>：{room.running_option.lmsr.L/this.state.precision}
            </td>
          );
        }
        else if (this.state.room.room_type == 1) {
          L = (
            <td width="33.33333%">
              <Translate content="seer.room.pvp_owner_percent"/>：{room.running_option.pvp_owner_percent/100}%
            </td>
          );
        }
        else if (this.state.room.room_type == 2) {
          L = (
            <td width="33.33333%">
              <Translate content="seer.room.pool"/>：<FormattedAsset amount={this.state.room.running_option.advanced.pool} asset={room.option.accept_asset}/>
            </td>
          );
        }
      };

        return (
          <div className="group-panel">
            <div className="group-title"><Translate content="seer.room.room_detail"/></div>
            <div className="group-content">
              <table className="room-detail-table" width="100%">
                <tbody>
                <tr>
                  <td width="33.33333%">
                    <Translate content="seer.room.room_id"/>：{room.id}
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.type"/>：{roomType[room.room_type]}
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.room_creator"/>：<LinkToAccountById account={room.owner}/>
                  </td>
                </tr>
                <tr>
                  <td width="33.33333%">
                    <Translate content="seer.room.label"/>：{room.label.join(",")}
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.accept_asset"/>：<LinkToAssetById asset={room.option.accept_asset}/>
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.room_status"/>：<Translate content={"seer.room.room_status_" + room.status }/>
                  </td>
                </tr>
                <tr>
                  <td width="33.33333%">
                    <Translate content="seer.room.max"/>：{room.option.maximum/this.state.precision}
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.min"/>：{room.option.minimum/this.state.precision}
                  </td>
                  {total_shares ? total_shares :
                    <td width="33.33333%">
                      <Translate content="seer.room.total_shares"/>：--
                    </td>
                  }
                </tr>
                <tr>
                  <td width="33.33333%">
                    <Translate content="account.votes.start"/>：{moment.utc(room.option.start).local().format('YYYY-MM-DD HH:mm:ss')}
                  </td>
                  <td width="33.33333%">
                    <Translate content="account.votes.end"/>：{moment.utc(room.option.stop).local().format('YYYY-MM-DD HH:mm:ss')}
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.input_duration_secs"/>：{room.option.input_duration_secs/60}
                  </td>
                </tr>
                <tr>
                  {L}
                  <td width="33.33333%">
                    <Translate content="seer.room.result_owner_percent"/>：{room.option.result_owner_percent/100}%
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.reward_per_oracle"/>：{room.option.reward_per_oracle / 100000} SEER
                  </td>
                </tr>
                <tr>
                  <td width="33.33333%">
                    <Translate content="seer.room.owner_pay_fee_percent"/>：{room.owner_pay_fee_percent/100}%
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.oracle.script"/>：{room.script}
                  </td>
                  <td width="33.33333%">
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
    }

    renderJoinFilter(){
      let {room} = this.state;
      return(
        <div className="group-panel">
          <div className="group-title"><Translate content="seer.room.filter"/></div>
          <div className="group-content">
            <table className="room-detail-table" width="100%">
              <tbody>
                <tr>
                  <td width="33.33333%">
                    <Translate content="seer.room.reputation"/>：{room.option.filter.reputation}
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.guaranty"/>：<FormattedAsset amount={room.option.filter.guaranty} asset={"1.3.0"}/>
                  </td>
                  <td width="33.33333%">
                    <Translate content="seer.room.volume"/>：{room.option.filter.volume}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    renderJoinNumber(){
      let {room} = this.state;

      let legendData = [];
      let seriesData = [];

      this.state.room.running_option.selection_description.map((d,i)=>{
        legendData.push(d);
        seriesData.push({name: d, value: room.running_option.player_count[i]});
      });

      let option = {
        title : {
          text: counterpart.translate("seer.room.join_number"),
          x:'center',
          y:'bottom',
          textStyle:{
            fontSize:14,
            color:"#333"
          }
        },
        color:chartColor,
        tooltip : {
          show: true
        },
        legend: {
          orient: 'vertical',
          left: 'right',
          top: 'middle',
          data: legendData
        },
        series : [
          {
            type: 'pie',
            radius : '55%',
            center: [legendData.length > 12 ? '20%' : '50%', '50%'],
            data: seriesData,
            itemStyle: {
              normal : {
                label : {
                  show : false
                },
                labelLine : {
                  show : false
                }
              },
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };

      return (
        <ReactEcharts option={option}/>
      );
    }

    renderJoinVolume(){
      let {room} = this.state;

      let legendData = [];
      let seriesData = [];

      this.state.room.running_option.selection_description.map((d,i)=>{
        legendData.push(d);

        if (room.room_type == 0) {
          seriesData.push({name: d, value: room.running_option.lmsr_running.items[i]/this.state.precision});
        } else if (room.room_type == 1) {
          seriesData.push({name: d, value: room.running_option.pvp_running.total_participate[i]/this.state.precision});
        } else if (room.room_type == 2) {
          seriesData.push({name: d, value: room.running_option.advanced_running.total_participate[i][0]/this.state.precision});
        }
      });

      let option = {
        title : {
          text: counterpart.translate("seer.room.join_volume"),
          x:'center',
          y:'bottom',
          textStyle:{
            fontSize:14,
            color:"#333"
          }
        },
        color:chartColor,
        tooltip : {
          show: true
        },
        legend: {
          orient: 'vertical',
          left: 'right',
          top: 'middle',
          data: legendData
        },
        series : [
          {
            type: 'pie',
            radius: ['40%', '55%'],
            center: [legendData.length > 12 ? '20%' : '50%', '50%'],
            data: seriesData,
            itemStyle: {
              normal : {
                label : {
                  show : false
                },
                labelLine : {
                  show : false
                }
              },
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };

      return (
        <ReactEcharts option={option}/>
      );
    }

    renderJoinDetail(){
      return (
        <div className="group-panel">
          <div className="group-title"><Translate content="seer.room.join_detail"/></div>
          <div className="group-content flex-align-middle">
            <div style={{flex:1}}>
              {this.renderJoinNumber.bind(this)()}
            </div>
            <div style={{flex:0.1}}>&nbsp;</div>
            <div style={{flex:1}}>
              {this.renderJoinVolume.bind(this)()}
            </div>
            <div style={{flex:0.1}}>&nbsp;</div>
          </div>
        </div>
      );
    }

    renderBroadcast(){
      let {room} = this.state;

      return (
        <div className="group-panel">
          <div className="group-title"><Translate content="seer.room.room_broadcast"/></div>
          <div className="group-content" style={{padding:0}}>
            <table className="room-history-table" width="100%">
              <thead>
                <tr>
                  <th><Translate content="account.transactions.type"/></th>
                  <th><Translate content="account.transactions.info"/></th>
                  <th><Translate content="account.transactions.time"/></th>
                </tr>
              </thead>
              <tbody>
              {
                this.state.historyList.map(h=>{

                  let op = [50,{
                    fee:{
                      amount:0,
                      asset_id:h.asset_id
                    },
                    issuer:h.player,
                    input:[h.input],
                    room:h.room
                  }];

                  // "operations": [//操作列表
                  //   [46, {//46操作类型表示开启房间
                  //     "fee": {//手续费
                  //       "amount": 10000000,//手续费金额，带100000精度，此处表示100.00000
                  //       "asset_id": "1.3.0"//手续费资产类型。此处表示SEER
                  //     },
                  //     "issuer": "1.2.14054",//发起人
                  //     "room": "1.15.1160",//房间号
                  //     "start": "2019-03-19T02:17:16",//开始时间
                  //     "stop": "2019-03-25T07:00:00",//结束时间
                  //     "input_duration_secs": 9600//开奖时间
                  //   }]
                  // ],

                  return (
                    <Operation
                      key={h.id}
                      op={op}
                      block={h.block_num}
                      hideFee={true}
                      withTxId={false}
                      timeTd={true}
                      hideOpLabel={false}
                      current={"1.2.0"}/>
                  );
                })
              }
              {
                this.state.historyList.length === 0 && <tr><td></td><td></td><td></td><td></td></tr>
              }
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    render() {
        let { room } = this.state;

        let options;
        if (!this.state.room.status){
            options = null;
        }
        else if( this.state.room.status == "closed" ){
            options = null;
        }
        else   if (this.state.room.room_type == 0) {
            let idx = 0;
            options = this.state.room.running_option.selection_description.map(c => {
                let dom = (
                    <label key={idx}>
                        <input type="radio" name="radio" value={idx} checked={this.state.checked_item == idx} onChange={this.handleInputChange.bind(this, idx)}/> {c}
                    </label>
                );
                idx++;
                return dom;
            });
        }
        else if (this.state.room.room_type == 1) {
            let total = 0;
            for(var i = 0;i<this.state.room.running_option.pvp_running.total_participate.length;i++) {
                total = total+this.state.room.running_option.pvp_running.total_participate[i];
            }
            let rate=[];
            for(var i = 0;i<this.state.room.running_option.pvp_running.total_participate.length;i++) {
                if(this.state.room.running_option.pvp_running.total_participate[i]>0){
                    rate.push(total/this.state.room.running_option.pvp_running.total_participate[i])
                }
                else {
                    rate.push("--");
                }
            }
            let idx = 0;
            options = this.state.room.running_option.selection_description.map(c => {
                let dom = (
                    <label key={idx}>
                        <input type="radio" name="radio" value={idx} checked={this.state.checked_item == idx} onChange={this.handleInputChange.bind(this, idx)}/> {c} (<Translate content="seer.room.current_rate"/>  1:{rate[idx]} )
                    </label>
                );
                idx++;
                return dom;
            });
        }
        else if (this.state.room.room_type == 2) {
            let idx = 0;
            options = this.state.room.running_option.selection_description.map(c => {
                let dom = (
                    <label key={idx}>
                        <input type="radio" name="radio" value={idx} checked={this.state.checked_item == idx} onChange={this.handleInputChange.bind(this, idx)}/> {c}(<Translate content="seer.room.current_rate"/> 1:{this.state.room.running_option.advanced.awards[idx]/10000})
                    </label>
                );
                idx++;
                return dom;
            });
        }

        let showMoney=null;
        if (this.state.room.room_type == 0 && this.state.room.running_option.lmsr_running){
            let money =  this._getTotal.bind(this)();
            // showMoney = (
            //   <Translate
            //     content="seer.room.show_money"
            //     _count={this.state.amount}
            //     amount={
            //       <FormattedAsset
            //         amount={money || 0}
            //         asset={this.state.room.option.accept_asset}
            //       />}
            //   />
            // )
        }


        let participate = null;
        if (this.state.room.status && this.state.room.status=="opening" ) participate = (
            <div className="content-block" style={{display: "inline-block", width: "35%", float: "right"}}>
                <h3><Translate content="seer.room.participate"/></h3>
                <div className="content-block">
                    {options}
                </div>
                <div className="content-block" style={{width: "50%"}}>
                    <label>
                        <Translate content="transfer.amount" />
                        ({this.state.room.room_type === 0 ? <Translate content="seer.room.part"/> : this.state.asset})
                        <input type="text" value={this.state.amount || 0}  onChange={this.changeAmount.bind(this)}/>
                        {showMoney}
                    </label>
                    {/*<AmountSelector asset={"1.3.0"} assets={[this.props.room.option.accept_asset]} onChange={this.textChange.bind(this)}/>*/}
                </div>
                <div className="content-block button-group">
                    <button className="button" onClick={this.onSubmit.bind(this)}>
                        <Translate content="seer.room.participate"/>
                    </button>
                </div>
            </div>
        );

      let playerCount = 0;

      room.running_option.player_count.map(c=>{
        playerCount += c;
      });

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div>
                      <RoomCard room={this.state.room} checkMode={true} showDetail={true} checkedItem={this.state.checked_item}
                                onOptionCheck={i=>this.setState({checked_item:i})}>
                        <div>
                          <div className="group-title">
                            <Translate content="transfer.amount" />
                            ({this.state.room.room_type === 0 ? <Translate content="seer.room.part"/> : this.state.asset})
                          </div>
                        </div>
                        <div className="group-content" style={{paddingTop:0}}>
                          <input type="text" value={this.state.amount || ""} placeholder={counterpart.translate("seer.room.placeholder_amount")} onChange={this.changeAmount.bind(this)}/>
                          {showMoney}
                          <div className="flex-align-middle room-info" style={{color:"#999",fontSize:12,marginTop:"1rem",height:"auto"}}>
                            <div>
                              <Translate content="seer.room.min"/>：{room.option.minimum/this.state.precision} {this.state.room.room_type === 0 ? <Translate content="seer.room.part"/> : this.state.asset}
                              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              <Translate content="seer.room.max"/>：{room.option.maximum/this.state.precision} {this.state.room.room_type === 0 ? <Translate content="seer.room.part"/> : this.state.asset}
                            </div>
                            <div className="flex-align-middle icon-info">
                              <i className="iconfont icon-icon" style={{color:"#7460ED",fontSize:23}}></i>
                              <FormattedAsset amount={room.running_option.total_shares} asset={room.option.accept_asset}/>
                              <i className="iconfont icon-zhanbitu" style={{color:"#FF972B",fontSize:23}}></i>{room.option.result_owner_percent/100}%
                              <i className="iconfont icon-renshu" style={{color:"#FC4C6C",fontSize:28}}></i>{playerCount}
                            </div>
                          </div>
                          { !!this.state.amount && parseInt(this.state.amount) >= (room.option.minimum/this.state.precision) && parseInt(this.state.amount) <= (room.option.maximum/this.state.precision) ?
                            <div className="room-info" style={{marginTop:40}}>
                              <div></div>
                              <div>
                                <span style={{color:"#666"}}><Translate content="seer.room.total_bets"/>：</span>
                                {<FormattedAsset amount={this._getTotal.bind(this)() || 0} exact_amount={room.room_type !== 0} asset={this.state.room.option.accept_asset}/>}
                                <button className="button large" onClick={this.onSubmit.bind(this)} style={{marginLeft:35,width:220,height:54}}>
                                  <Translate content="seer.room.participate"/>
                                </button>
                              </div>
                            </div> : null
                          }
                        </div>
                      </RoomCard>
                      {this.renderJoinDetail.bind(this)()}
                      {this.renderRoomInfo.bind(this)()}
                      {this.renderJoinFilter.bind(this)()}
                      {this.renderBroadcast.bind(this)()}
                    </div>
                </div>
            </div>
         );
    }
}

export default BindToChainState(RoomParticipate);
