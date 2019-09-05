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
let roomType =
{
    0:"PVD",
    1:"PVP",
    2:"ADV"
};
class RoomCard extends React.Component {

    static propTypes = {
        room: ChainTypes.ChainObject.isRequired,
        showClosed:React.PropTypes.bool,
        filterLabel:React.PropTypes.string
    };

    static defaultProps = {
        room: "props.params.room_id",
        showClosed:false
    }

    constructor(props) {
        super(props);
        this.state = {
            checked_item: 0,
            amount: null,
            room: props.room.toJS(),
            account: null,
            asset:null,
            precision:null
            //oracles:[]
        };
    }

    componentWillReceiveProps(next) {

    }

    componentWillMount() {
        let roomId = this.props.room.get("id");
        Apis.instance().db_api().exec("get_seer_room", [roomId, 0, 500]).then(r => {
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
    }

    render() {
        let {room} = this.state;

        if( !this.props.showClosed && this.state.room.status == "closed" ){
          return null;
        }

        if(this.props.filterLabel) {
          let match = false;

          for (let i = 0; i < room.label.length; i++) {
            if (this.props.filterLabel.indexOf(room.label[i]) > -1) {
              match = true;
              break;
            }
          }

          if(!match){
            return null;
          }
        }

        let options;
        if (!this.state.room.status){
            options = null;
        }
        else if( this.state.room.status == "closed" ){
            options = null;
        }

        else   if (this.state.room.room_type == 0) {
            let idx = 0;
            options = this.state.room.running_option.selection_description.map((c,index) => {
                let dom = (
                    <li key={idx}>
                        <div>{c}</div>
                    </li>
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
                    <li key={idx}>
                        <div>{c}</div>
                        <div className="rate"><Translate content="seer.room.current_rate"/>  1:{rate[idx]} </div>
                    </li>
                );
                idx++;
                return dom;
            });
        }
        else if (this.state.room.room_type == 2) {
            let idx = 0;
            options = this.state.room.running_option.selection_description.map(c => {
                let dom = (
                    <li key={idx}>
                        <div>{c}</div>
                        <div className="rate"><Translate content="seer.room.current_rate"/> 1:{this.state.room.running_option.advanced.awards[idx]/10000} </div>
                  </li>
                );
                idx++;
                return dom;
            });
        }


        let optionClass = "";
        let patchLI = [];

        if(options.length === 2){
            optionClass = "two-options";
        }else if(options.length % 3 === 0){
            optionClass = "three-options";
        }else if(options.length % 3 > 0){
            optionClass = "three-options last-options";

            let count = (3 - options.length % 3);
            for(let i = 0;i < count;i++){
                patchLI.push(<li key={i} className="empty"></li>);
            }
        }

        let playerCount = 0;

        room.running_option.player_count.map(c=>{
            playerCount += c;
        });

        return (
            <div className="room-card">
                <div className="room-title">
                    <Translate className="label-recommend" component="i" content="seer.room.recommend"/>&nbsp;  {room.description}
                    <span className={"room-type " + roomType[room.room_type]}>{roomType[room.room_type]}</span>
                </div>
                <ul className={"room-options " + optionClass}>
                    {options}{patchLI}
                </ul>
                <div className="room-info">
                    <div className="flex-align-middle">
                        <i className="iconfont icon-icon" style={{color:"#7460ED",fontSize:23}}></i>
                        <FormattedAsset amount={room.running_option.total_shares} asset={room.option.accept_asset}/>
                        <i className="iconfont icon-zhanbitu" style={{color:"#FF972B",fontSize:23}}></i>{room.option.result_owner_percent/100}%
                        <i className="iconfont icon-renshu" style={{color:"#FC4C6C",fontSize:28}}></i>{playerCount}
                    </div>
                    <div className="right">
                        <Translate content="seer.room.end_time"/>：&nbsp;{moment(room.option.stop).format('YYYY/MM/DD HH:mm:ss')}
                        <Link to={"/houses/rooms/" + room.id }><Translate content="seer.room.open_detail"/></Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default BindToChainState(RoomCard);
