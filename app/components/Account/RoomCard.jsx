import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import moment from 'moment'
import {Link} from "react-router/es";
import SeerActions from "../../actions/SeerActions";
import {ChainStore} from "seerjs/es";
var Apis =  require("seerjs-ws").Apis;
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import FormattedAsset from "../Utility/FormattedAsset";
import {Tabs, Tab} from "../Utility/Tabs";

import AccountStore from "../../stores/AccountStore";
import { Asset } from "../../lib/common/MarketClasses";
import _ from "lodash";
let roomType =
{
    0:"PVD",
    1:"PVP",
    2:"ADV"
};
class RoomCard extends React.Component {

    static propTypes = {
        room: ChainTypes.ChainObject,
        roomObject:React.PropTypes.object,
        recommend:React.PropTypes.bool,
        checkMode:React.PropTypes.bool,
        onOptionCheck:React.PropTypes.func,
        checkedItem:React.PropTypes.number,
        showGiveUpOption:React.PropTypes.bool
    };

    constructor(props) {
        super(props);

        let room = ((this.props.room && this.props.room.toJS()) || this.props.roomObject);
        this.state = {
            checked_item: typeof this.props.checkedItem === "undefined" ? -1 : this.props.checkedItem,
            amount: null,
            room: room,
            currentRoom:room,
            currentRoomIndex:0,
            account: null,
            asset:null,
            precision:null,
            mutiRoomSubTitles:[]
            //oracles:[]
        };
    }

    componentWillMount() {
        if(this.state.room) {
          Apis.instance().db_api().exec("get_assets", [[this.state.room.option.accept_asset]]).then(objs => {
            var ret = [];
            objs.forEach(function(item, index) {
              ret.push(item);
            });
            let symbol = ret.length > 0 ? ret[0].symbol : "";

            let precision = ret.length > 0 ? Math.pow(10, parseInt(ret[0].precision)) : 1;
            this.setState({ asset: symbol, precision: precision });
          });
        }

      if(this.state.room.description.indexOf("(@#-") !== -1 && this.state.room.description.indexOf("-#@)") !== -1) {
        let titles = [];
        titles.push(this._getRoomSubTitle(this.state.room.description));
        this.state.room.description = this._fixRoomdesc(this.state.room.description);

        if(this._isMutiRooms()) {
          this.state.room.subRooms.map(r => {
            titles.push(this._getRoomSubTitle(r.description));
            r.description = this._fixRoomdesc(r.description);
          });
        }else{
          this.state.room.description = "[ " + titles[0] + " ] " + this.state.room.description;
        }
        this.state.mutiRoomSubTitles = titles;
      }
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
    }

    _fixRoomdesc(desc){
      return desc.substring(desc.indexOf("-#@)")+4);
    }
    _getRoomSubTitle(desc){
      let head = desc.match(/(?<=\(@#-)\S+(?=-#@\))/g)[0];
      let title = head.substring(head.indexOf(")")+1).trim();
      return title;
    }

    _onOptionClick(idx){
        this.setState({
          checked_item:idx
        });
        if(this.props.onOptionCheck){
            let room = _.cloneDeep(this.state.currentRoom);
            if(this._isMutiRooms()) {
              room.description = "[ " + this.state.mutiRoomSubTitles[this.state.currentRoomIndex] + " ] " + room.description;
            }
            this.props.onOptionCheck(idx,room);
        }
    }

    _isMutiRooms(){
      return this.state.room.subRooms && this.state.room.subRooms.length > 0;
    }

    _onRoomSelecterClick(index){
      let room = null;
      if(index===0){
        room = this.state.room;
      }else{
        room = this.state.room.subRooms[index-1];
      }
      this.setState({
        currentRoom: room,
        currentRoomIndex:index
      })
    }

    renderRoomSelecter(){
      if(this._isMutiRooms()) {
        return (
          <ul className={"room-selector"}>
            {
              this.state.mutiRoomSubTitles.map((t,i)=>{
                return (
                  <li className={this.state.currentRoomIndex === i ? "checked":""} key={t} onClick={this._onRoomSelecterClick.bind(this,i)}>{t}</li>
                );
              })
            }
          </ul>
        );
      }
    }

    render() {
        let { currentRoom } = this.state;

        if(!currentRoom) return null;

        let options;

        if (!currentRoom.status){
            options = null;
        }else if(currentRoom.status == "closed" ){
            options = null;
        }else if (currentRoom.room_type == 0) {
            options = currentRoom.running_option.selection_description.map((c,index) => {
                let className = this.props.checkMode && (index === this.state.checked_item) ? "checked" :"";
                return (
                    <li key={index} className={className} onClick={e=>{this._onOptionClick.bind(this)(index)}}>
                        <div>{c}</div>
                    </li>
                );
            });
        }
        else if (currentRoom.room_type == 1) {
            let total = 0;
            for(var i = 0;i<currentRoom.running_option.pvp_running.total_participate.length;i++) {
                total = total+currentRoom.running_option.pvp_running.total_participate[i];
            }
            let rate=[];
            for(var i = 0;i<currentRoom.running_option.pvp_running.total_participate.length;i++) {
                if(currentRoom.running_option.pvp_running.total_participate[i]>0){
                    rate.push(total/currentRoom.running_option.pvp_running.total_participate[i])
                }
                else {
                    rate.push("--");
                }
            }

            options = currentRoom.running_option.selection_description.map((c,index) => {
                let className = this.props.checkMode && (index === this.state.checked_item) ? "checked" :"";
                return (
                    <li key={index} className={className} onClick={e=>{this._onOptionClick.bind(this)(index)}}>
                        <div>{c}</div>
                        <div className="rate"><Translate content="seer.room.current_rate"/>  1:{rate[index]} </div>
                    </li>
                );
            });
        }
        else if (currentRoom.room_type == 2) {
            options = currentRoom.running_option.selection_description.map((c,index) => {
                let className = this.props.checkMode && (index === this.state.checked_item) ? "checked" :"";
                return (
                    <li key={index} className={className} onClick={e=>{this._onOptionClick.bind(this)(index)}}>
                        <div>{c}</div>
                        <div className="rate"><Translate content="seer.room.current_rate"/> 1:{currentRoom.running_option.advanced.awards[index]/10000} </div>
                  </li>
                );
            });
        }

        if(this.props.showGiveUpOption){
          let className = this.props.checkMode && (255 === this.state.checked_item) ? "checked" :"";
          options.push(<li key={"giveUp"} className={className} onClick={e=>{this._onOptionClick.bind(this)(255)}}>
            <div><Translate content="seer.room.abandon"/></div>
          </li>);
        }


        let optionClass = "";
        let patchLI = [];

        if(options != null) {
          if (options.length === 2) {
            optionClass = "two-options";
          } else if (options.length % 3 === 0) {
            optionClass = "three-options";
          } else if (options.length % 3 > 0) {
            optionClass = "three-options last-options";

            let count = (3 - options.length % 3);
            for (let i = 0; i < count; i++) {
              patchLI.push(<li key={i} className="empty"></li>);
            }
          }
        }

        let playerCount = 0;

        currentRoom.running_option.player_count.map(c=>{
            playerCount += c;
        });

        return (
            <div className="room-card">
                <div className="room-title">
                  {
                    this.props.recommend ? <Translate className="label-recommend" component="i" content="seer.room.recommend"/> : null
                  }
                    {currentRoom.description}
                    <span className={"room-type " + roomType[currentRoom.room_type]}>{roomType[currentRoom.room_type]}</span>
                </div>
                {this.renderRoomSelecter.bind(this)()}
                <ul className={"room-options " + optionClass}>
                    {options}{patchLI}
                </ul>

              {
                this.props.children ?
                  <div className="room-detail">
                    {this.props.children}
                  </div>:
                <div className="room-info">
                    <div className="flex-align-middle icon-info">
                        <i className="iconfont icon-icon" style={{color:"#7460ED",fontSize:23}}></i>
                        <FormattedAsset amount={currentRoom.running_option.total_shares} asset={currentRoom.option.accept_asset}/>
                        <i className="iconfont icon-zhanbitu" style={{color:"#FF972B",fontSize:23}}></i>{currentRoom.option.result_owner_percent/100}%
                        <i className="iconfont icon-renshu" style={{color:"#FC4C6C",fontSize:28}}></i>{playerCount}
                    </div>
                    <div className="right">
                        <Translate content="seer.room.end_time"/>：&nbsp;{moment(currentRoom.option.stop).format('YYYY/MM/DD HH:mm:ss')}
                        <Link to={"/prediction/rooms/" + currentRoom.id }><Translate content="seer.room.open_detail"/></Link>
                    </div>
                </div>
              }
            </div>
        );
    }
}

export default BindToChainState(RoomCard);
