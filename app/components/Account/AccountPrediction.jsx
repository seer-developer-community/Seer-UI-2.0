import React from "react";
import Immutable from "immutable";
import DashboardList from "../Dashboard/DashboardList";
import { RecentTransactions } from "../Account/RecentTransactions";
import LoadingIndicator from "../LoadingIndicator";
import LoginSelector from "../LoginSelector";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import AccountStore from "stores/AccountStore";
import MarketsStore from "stores/MarketsStore";
import {Tabs, Tab} from "../Utility/Tabs";
import AltContainer from "alt-container"
import AccountApi from "api/accountApi"
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import WebApi from "../../api/WebApi";
import {Link} from "react-router/es";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "../Modal/BaseModal";
import OpenRoomModal from "../Modal/OpenRoomModal";
import SeerActions from "../../actions/SeerActions";
import StopParticipateModal from "../Modal/StopParticipateModal";
import RoomInput from "./RoomInput";
import OracleInput from "./OracleInput";

class AccountPredictionContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore, SettingsStore, MarketsStore]}
                inject={{
                    linkedAccounts: () => {
                        return AccountStore.getState().linkedAccounts;
                    },
                    myIgnoredAccounts: () => {
                        return AccountStore.getState().myIgnoredAccounts;
                    },
                    accountsReady: () => {
                        return AccountStore.getState().accountsLoaded && AccountStore.getState().refsLoaded;
                    },
                    passwordAccount: () => {
                        return AccountStore.getState().passwordAccount;
                    },
                    lowVolumeMarkets: () => {
                        return MarketsStore.getState().lowVolumeMarkets;
                    },
                    currentEntry: SettingsStore.getState().viewSettings.get("dashboardEntry", "accounts")
                }}>
                <AccountPrediction {...this.props} />
            </AltContainer>
        );
    }
}

class AccountPrediction extends React.Component {

    constructor(props) {
        super();

        this.state = {
            width: null,
            showIgnored: false,
            currentEntry: props.currentEntry,
            myJoinedPredictions:[],
            myCreatedPredictions:[],
            current_room:null,
            inputType:null, //input ,oracleInput
        };
    }

    componentDidMount() {

        let rpath = this.props.routes[this.props.routes.length - 1].path;
        if(rpath === "history"){
          SettingsActions.changeViewSetting.defer({ accountTab:1 });
        }else if(rpath === "contacts"){
          SettingsActions.changeViewSetting.defer({ accountTab:2 });
        }else{
          SettingsActions.changeViewSetting.defer({ accountTab:0 });
        }

        this._loadData(this.props.account.get("id"));
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts ||
            nextProps.passwordAccount !== this.props.passwordAccount ||
            nextState.width !== this.state.width ||
            nextProps.accountsReady !== this.props.accountsReady ||
            nextState.showIgnored !== this.state.showIgnored ||
            nextState.currentEntry !== this.state.currentEntry||
            nextState.myJoinedPredictions !== this.state.myJoinedPredictions||
            nextState.myCreatedPredictions !== this.state.myCreatedPredictions||
            nextState.inputType !== this.state.inputType||
            nextState.current_room !== this.state.current_room
        );
    }

    componentWillReceiveProps(nextProps){
      if(nextProps.account.get("id") !== this.props.account.get("id")) {
        this._loadData(nextProps.account.get("id"));
      }
    }

    _loadData(oid){
      AccountApi.getAccountPredictionRecord(oid).then(res=>{
        this.setState({
          myJoinedPredictions:res
        });
      });

      AccountApi.getRoomsByAccount(oid).then(res=>{
        let roomIds = [];
        console.log(res);
        roomIds.push(...res[0][1]);
        let histories = res[1][1].length > 10 ? _.slice(res[1][1],0,10) : res[1][1];
        roomIds.push(...histories);

        WebApi.getSeerRooms(roomIds,false).then(rooms => {
          this.setState({
            myCreatedPredictions:rooms
          });
        });
      });
    }

    openRoom(room) {
      this.setState({current_room: room},()=>{
        ZfApi.publish("open_room", "open");
      });
    }

    stopParticipate(room) {
      this.setState({current_room: room},()=>{
        ZfApi.publish("stop_participate", "open");
      });
    }

    inputRoom(room) {
      this.setState({
        current_room: room,
        inputType: "input"
      });
    }

    oracleInputRoom(room) {
      this.setState({
        current_room: room,
        inputType: "oracleInput"
      });
    }

    finalRoom(room) {
      var args = {
        issuer: this.props.account.get("id"),
        room: room.id,
      };
      SeerActions.finalRoom(args);
    }

    settleRoom(room) {
      var args = {
        issuer: this.props.account.get("id"),
        room: room.id,
      };
      SeerActions.settleRoom(args);
    }

    render() {
        let { account ,linkedAccounts, myIgnoredAccounts, accountsReady, passwordAccount } = this.props;
        let {width, showIgnored, featuredMarkets, newAssets, currentEntry} = this.state;
        let isMyAccount = AccountStore.isMyAccount(account);

        if (passwordAccount && !linkedAccounts.has(passwordAccount)) {
            linkedAccounts = linkedAccounts.add(passwordAccount);
        }
        let names = linkedAccounts.toArray().sort();
        if (passwordAccount && names.indexOf(passwordAccount) === -1) names.push(passwordAccount);
        let ignored = myIgnoredAccounts.toArray().sort();

        let accountCount = linkedAccounts.size + myIgnoredAccounts.size + (passwordAccount ? 1 : 0);

        if (!accountsReady) {
            return <LoadingIndicator />;
        }

        if (!accountCount) {
            // return <LoginSelector />;
        }

        let joinedRows = this.state.myJoinedPredictions.map(r=>{
          if(typeof r.room === "string") return null;
          return(
            <tr key={r.id}>
              <td>{r.room.id}</td>
              <td style={{textAlign:"center"}}>{r.room.room_type === 0 ? "PVD" : r.room.room_type === 1 ? "PVP" : "AVD"}</td>
              <td style={{lineHeight:"22px"}}><div>{r.room.description}</div></td>
              <td style={{lineHeight:"22px"}}><div>{r.room.option.start} - </div><div>{r.room.option.stop}</div></td>
              <td style={{color:r.room.status==="opening"?"#FB7704":"#666"}}>{r.room.status}</td>
              <td style={{textAlign:"right"}}><FormattedAsset amount={r.paid} asset={r.asset_id} hide_asset={false}/></td>
              <td style={{textAlign:"right",color:r.reward < 0 ?"#E20E26": r.reward === 0 ? "#666" : "#449E7B"}}><FormattedAsset amount={r.reward} asset={r.asset_id} hide_asset={false}/></td>
            </tr>
          );
        });


      let createdRows = this.state.myCreatedPredictions.map(room=>{
        let isMyRoom = isMyAccount && (room.owner === account.get("id"));
        let localUTCTime = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
        return(
          <tr key={room.id}>
            <td>{room.id}</td>
            <td style={{textAlign:"center"}}>{room.room_type === 0 ? "PVD" : room.room_type === 1 ? "PVP" : "AVD"}</td>
            <td style={{lineHeight:"22px"}}><div>{room.description}</div></td>
            <td style={{lineHeight:"22px"}}><div>{room.label && room.label.length > 0 ?  room.label.join("/") : "--"}</div></td>
            <td style={{lineHeight:"22px"}}><div>{room.option.start} - </div><div>{room.option.stop}</div></td>
            <td style={{color:room.status==="opening"?"#FB7704":"#666"}}>{room.status}</td>
            <td style={{textAlign:"right"}}>
              <div className="nowrap">
              <Link className="button tiny outline fillet" to={"prediction/rooms/" + room.id}><Translate content="seer.room.view"/></Link>
              {
                isMyRoom && room.status == "closed" ?
                  <button className="button tiny outline fillet" onClick={this.openRoom.bind(this, room)}>
                    <Translate content="seer.room.open"/>
                  </button>
                  :
                  null
              }

              {
                isMyRoom && room.status == "opening" && new Date(room.option.stop).getTime() > localUTCTime ?
                  <button className="button tiny outline fillet" onClick={this.stopParticipate.bind(this, room)}>
                    <Translate content="seer.room.stop_participate"/>
                  </button>
                  :
                  null
              }
              {
                ((room.status == "opening" || room.status == "inputing") &&
                  ( (new Date(room.option.stop).getTime() < localUTCTime )&&
                  new Date(room.option.stop).getTime() + room.option.input_duration_secs * 1000 > localUTCTime ||
                  new Date(room.option.stop).getTime() + room.option.input_duration_secs * 1000 < localUTCTime &&
                    new Date(room.option.stop).getTime() + room.option.input_duration_secs * 1000 + 7 * 24 * 3600000 > localUTCTime &&
                  (!room.owner_result || room.owner_result.length === 0) &&
                  (!room.committee_result || room.committee_result.length === 0) &&
                  (!room.oracle_sets || room.oracle_sets.length === 0))) ?
                  <span>
                      {
                        isMyRoom
                          ?
                          <button className="button tiny outline fillet" onClick={this.inputRoom.bind(this, room)}>
                              <Translate content="seer.room.input"/>
                          </button>
                          :
                          null
                      }

                      <button className="button tiny outline fillet" onClick={this.oracleInputRoom.bind(this, room)}>
                         <Translate content="seer.oracle.input"/>
                      </button>
                     </span>
                  :
                  null
              }
              {
                isMyRoom && (room.status == "opening" || room.status == "inputing") &&
                new Date(room.option.stop).getTime() + room.option.input_duration_secs * 1000 < localUTCTime &&
                ((room.owner_result && room.owner_result.length !== 0) || (room.committee_result && room.committee_result.length !==0)  || (room.oracle_sets && room.oracle_sets.length !== 0)) ?
                  <button className="button tiny outline fillet" onClick={this.finalRoom.bind(this, room)}>
                    <Translate content="seer.room.final"/>
                  </button>
                  :
                  null
              }
              {
                isMyRoom && (room.status == "finaling" || room.status == "settling") ?
                  <button className="button tiny outline fillet" onClick={this.settleRoom.bind(this, room)}>
                    <Translate content="seer.room.settle"/>
                  </button>
                  :
                  null
              }

              {
                isMyRoom && (room.status == "closed" || room.room_type == 2) ?
                  <Link to={`/account/${this.props.account.get("name")}/update-room/${room.id}`} className="button tiny outline fillet">
                    <Translate content="seer.room.update"/>
                  </Link>
                  :
                  null
              }
              </div>
            </td>
          </tr>
        );
      });


        return (
            <div ref="wrapper" className="grid-block page-layout vertical">
                <div ref="container" className="tabs-container generic-bordered-box">
                    <Tabs
                        setting="predictionTab"
                        className="account-tabs"
                        defaultActiveTab={0}
                        segmented={false}
                        tabsClass="account-overview no-padding bordered-header content-block">

                        <Tab title="seer.house.my_joined">
                            <div className="generic-bordered-box">
                                <div className="box-content">
                                    <table className="table table-hover dashboard-table">
                                      <thead>
                                        <tr>
                                          <th width="110px"><Translate content="seer.room.room_id"/></th>
                                          <th width="100px" style={{textAlign:"center"}}><Translate content="seer.room.type"/></th>
                                          <th><Translate content="seer.oracle.description"/></th>
                                          <th width="200px"><Translate content="seer.room.start_stop"/></th>
                                          <th width="140px"><Translate content="seer.room.status"/></th>
                                          <th width="150px" style={{textAlign:"right"}}><Translate content="seer.room.join_amount"/></th>
                                          <th width="150px" style={{textAlign:"right"}}><Translate content="seer.room.join_result"/></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {joinedRows}
                                      </tbody>
                                    </table>
                                </div>
                            </div>
                        </Tab>

                      <Tab title="seer.house.my_created">
                        <div className="generic-bordered-box">
                          <div className="box-content">
                            { this.state.inputType === null ?
                              <table className="table table-hover dashboard-table">
                                <thead>
                                <tr>
                                  <th width="100px"><Translate content="seer.room.room_id"/></th>
                                  <th width="100px" style={{ textAlign: "center" }}><Translate content="seer.room.type"/></th>
                                  <th><Translate content="seer.oracle.description"/></th>
                                  <th><Translate content="seer.room.label"/></th>
                                  <th width="200px"><Translate content="seer.room.start_stop"/></th>
                                  <th width="140px"><Translate content="seer.room.status"/></th>
                                  <th style={{ textAlign: "right" }}><Translate content="account.witness.collateral.operation"/></th>
                                </tr>
                                </thead>
                                <tbody>
                                {createdRows}
                                </tbody>
                              </table>
                              : this.state.inputType === "input" ?
                                <RoomInput room={this.state.current_room} account={account} onBack={()=>this.setState({inputType:null})}/>
                                :
                                <OracleInput room={this.state.current_room} account={account} onBack={()=>this.setState({inputType:null})}/>
                            }
                          </div>
                        </div>
                      </Tab>
                    </Tabs>
                </div>

              <BaseModal id="open_room" overlay={true}>
                <br/>
                <div className="grid-block vertical">
                  <OpenRoomModal
                    room={this.state.current_room}
                    account={this.props.account}
                    onClose={() => {ZfApi.publish("open_room", "close");}}
                  />
                </div>
              </BaseModal>
              <BaseModal id="stop_participate" overlay={true}>
                <br/>
                <div className="grid-block vertical">
                  <StopParticipateModal
                    room={this.state.current_room}
                    account={this.props.account}
                    onClose={() => {ZfApi.publish("stop_participate", "close");}}
                  />
                </div>
              </BaseModal>
            </div>
        );
    }
}

const AccountPredictionWapper = (props) => {
    return <AccountPredictionContainer {...props} onlyAccounts />;
};

export default AccountPredictionWapper;
