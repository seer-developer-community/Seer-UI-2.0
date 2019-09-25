import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router/es";
import Translate from "react-translate-component";
import AssetActions from "actions/AssetActions";
import AssetStore from "stores/AssetStore";
import AccountActions from "actions/AccountActions";
import BaseModal from "../Modal/BaseModal";
import FormattedAsset from "../Utility/FormattedAsset";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import notify from "actions/NotificationActions";
import utils from "common/utils";
import {debounce} from "lodash";
import LoadingIndicator from "../LoadingIndicator";
import IssueModal from "../Modal/IssueModal";
import ReserveAssetModal from "../Modal/ReserveAssetModal";
import { connect } from "alt-react";
import assetUtils from "common/asset_utils";
import { Map, List } from "immutable";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {Tabs, Tab} from "../Utility/Tabs";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import RoomInput from "./RoomInput";
import OracleInput from "./OracleInput";
import WebApi from "../../api/WebApi";
import AccountStore from "../../stores/AccountStore";
import Icon from "../Icon/Icon";
import _ from "lodash"
var Apis =  require("seerjs-ws").Apis;

class AccountOracle extends React.Component {

    static defaultProps = {
        symbol: "",
        name: "",
        description: "",
        max_supply: 0,
        precision: 0
    };

    static propTypes = {
        assetsList: ChainTypes.ChainAssetsList,
        symbol: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            create: {
                symbol: "",
                name: "",
                description: "",
                max_supply: 1000000000000000,
                precision: 4
            },
            issue: {
                amount: 0,
                to: "",
                to_id: "",
                asset_id: "",
                symbol: ""
            },
            errors: {
                symbol: null
            },
            isValid: false,
            searchTerm: "",
            oracle: {
                description: "",
                guaranty: 0,
                id: "",
                locked_guaranty: 0,
                owner: this.props.account.get("id"),
                reputation: 0,
                script: "",
                volume: 0
            },
            awardsGt:SettingsStore.getState().settings.get("room_notice_awards_gt",0),
            awardsGtEnable:SettingsStore.getState().settings.get("room_notice_awards_gt_enable",false),
            awardsGtEditable:false,
            endTime:SettingsStore.getState().settings.get("room_notice_end_time_lt",0),
            endTimeEnable:SettingsStore.getState().settings.get("room_notice_end_time_lt_enable",false),
            endTimeEditable:false,
            needOracleInputRooms:[],
            isOracleInputting:false,
            current_room:null,
            sortType:"desc",
            sortBy:3
        };
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.account !== this.props.account){
            this._loadData(nextProps.account);
        }
    }

    componentWillMount() {
        this._loadData(this.props.account);

        this._loadQueryInputRoom();

        //console.log(this.props.location.query);
    }

    _loadQueryInputRoom(){
        if(this.props.location.query.input === "1" && this.props.location.query.room) {
            WebApi.getSeerRoom(this.props.location.query.room).then(r => {
                SettingsActions.changeViewSetting({ myOracleTab:1 });
                this.setState({
                    isOracleInputting:true,
                    current_room:r
                });
            });
        }
    }

    _loadData(account){
      Apis.instance().db_api().exec("get_oracle_by_account", [account.get("id")]).then((results) => {
        this.setState({oracle: results})
      });

      //
      WebApi.getAllSeerRoom({statusFilter:["inputing"]}).then(rooms=>{
          rooms = rooms || [];
          rooms = _.filter(rooms,r=>r.option.reward_per_oracle > 0);
          this.setState({
            needOracleInputRooms:rooms
          });
      });
    }

      oracleInputRoom(room) {
        this.setState({
          current_room: room,
          isOracleInputting: true
        });
      }

    _reserveButtonClick(assetId, e) {
        e.preventDefault();
        this.setState({reserve: assetId});
        ZfApi.publish("reserve_asset", "open");
    }

    _issueButtonClick(asset_id, symbol, e) {
        e.preventDefault();
        let {issue} = this.state;
        issue.asset_id = asset_id;
        issue.symbol = symbol;
        this.setState({issue: issue});
        ZfApi.publish("issue_asset", "open");
    }

    _editButtonClick(symbol, account_name, e) {
        e.preventDefault();
        this.props.router.push(`/account/${account_name}/update-asset/${symbol}`);
    }

    _onAwardsGTEditClick(){
        if(this.state.awardsGtEditable){
            SettingsActions.changeSetting({
                setting : "room_notice_awards_gt", value : parseInt(this.state.awardsGt)
            });
        }
        this.setState({awardsGtEditable:!this.state.awardsGtEditable})
    }

    _onEndTimeLTEditClick(){
        if(this.state.endTimeEditable){
            SettingsActions.changeSetting({
                setting : "room_notice_end_time_lt", value : parseInt(this.state.endTime)
            });
        }
        this.setState({endTimeEditable:!this.state.endTimeEditable})
    }

    _onAwardsGTSwitch(){
      this.setState({awardsGtEnable:!this.state.awardsGtEnable},()=>{
        SettingsActions.changeSetting({
          setting : "room_notice_awards_gt_enable", value : this.state.awardsGtEnable
        });
      });
    }

    _onEndTimeLTSwitch(){
      this.setState({endTimeEnable:!this.state.endTimeEnable},()=>{
        SettingsActions.changeSetting({
          setting : "room_notice_end_time_lt_enable", value : this.state.endTimeEnable
        });
      });
    }

    renderOracle() {
      let {account_name} = this.props;

      return (
        <div className="content-block small-12" style={{paddingTop:"34px"}}>

          <Translate content="seer.oracle.my" component="h5" style={{fontWeight:"bold"}}/>
          <Translate content="seer.oracle.explain" component="p" style={{fontSize:"14px",color:"#999"}}/>

          <div className="tabs-container generic-bordered-box">

            {
              this.state.oracle && this.state.oracle.id ?
                <div className="content-block">
                  <table className="table key-value-table">
                    <tbody>
                    <tr>
                      <td><Translate content="seer.oracle.guaranty"/></td>
                      <td><FormattedAsset amount={this.state.oracle.guaranty} asset={"1.3.0"}/></td>
                    </tr>
                    <tr>
                      <td><Translate content="seer.oracle.locked_guaranty"/></td>
                      <td>{this.state.oracle.locked_guaranty}</td>
                    </tr>
                    <tr>
                      <td><Translate content="seer.oracle.reputation"/></td>
                      <td>{this.state.oracle.reputation}</td>
                    </tr>
                    <tr>
                      <td><Translate content="seer.oracle.volume"/></td>
                      <td>{this.state.oracle.volume}</td>
                    </tr>
                    <tr>
                      <td>
                        <span><Translate content="seer.oracle.script"/></span>
                      </td>
                      <td>{this.state.oracle.script} </td>
                    </tr>
                    <tr>
                      <td style={{width:"150px"}}><Translate content="seer.oracle.description"/></td>
                      <td>{this.state.oracle.description}</td>
                    </tr>
                    <tr>
                      <td rowSpan="2" style={{verticalAlign:"top",paddingTop:20}}><Translate content="seer.oracle.remind"/></td>
                      <td>
                        <div className="flex-align-middle">
                          <Translate content="seer.oracle.remind_awards_gt"/>
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          {
                            this.state.awardsGtEditable ?
                              <input type="text" style={{display:"inline-block",width:80,height:22,margin:0,padding:"0 3px",fontSize:14,borderColor:"#4BA180"}} value={this.state.awardsGt} onInput={e=>this.setState({awardsGt:e.target.value.replace(/[^\d]/g,'')})}/>
                              :
                              <input type="text" style={{display:"inline-block",width:80,height:22,margin:0,padding:"0 3px",fontSize:14}} disabled={true} value={this.state.awardsGt}/>
                          }
                          &nbsp;&nbsp;&nbsp;&nbsp;SEER
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <a onClick={this._onAwardsGTEditClick.bind(this)}>
                            <Translate content={this.state.awardsGtEditable ? "confirm" : "seer.oracle.remind_update"}/>
                          </a>
                          <div style={{flex:1,textAlign:"right"}}>
                            <div className="switch" onClick={this._onAwardsGTSwitch.bind(this)}>
                              <input type="checkbox" checked={this.state.awardsGtEnable} />
                              <label />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{marginLeft:5}}  className="flex-align-middle">
                          <Translate content="seer.oracle.remind_end_time_lt"/>
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          {
                            this.state.endTimeEditable ?
                              <input type="text" style={{display:"inline-block",width:80,height:22,margin:0,padding:"0 3px",fontSize:14,borderColor:"#4BA180"}} value={this.state.endTime} pattern="[0-9]*" onInput={e=>this.setState({endTime:e.target.value.replace(/[^\d]/g,'')})}/>
                              :
                              <input type="text" style={{display:"inline-block",width:80,height:22,margin:0,padding:"0 3px",fontSize:14}} disabled={true} value={this.state.endTime}/>
                          }
                          &nbsp;&nbsp;&nbsp;&nbsp;MIN
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <a onClick={this._onEndTimeLTEditClick.bind(this)}>
                            <Translate content={this.state.endTimeEditable ? "confirm" : "seer.oracle.remind_update"}/>
                          </a>
                          <div style={{flex:1,textAlign:"right"}}>
                            <div className="switch" onClick={this._onEndTimeLTSwitch.bind(this)}>
                              <input type="checkbox" checked={this.state.endTimeEnable} />
                              <label />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                  <div className="content-block" style={{marginTop:"48px"}}>
                    <Link className="button primary" to={`/account/${account_name}/update-oracle/${this.state.oracle.id}`}>
                      <Translate content="seer.oracle.update" />
                    </Link>
                  </div>
                </div>
                :
                <div className="content-block" style={{textAlign:"center",marginTop:"10em"}}>
                  <svg className="icon" aria-hidden="true" style={{width:"5.19em",height:"4.35em",marginBottom:"10px"}}>
                    <use xlinkHref="#icon-zanwujilu1-copy"></use>
                  </svg>
                  <p><Translate content="seer.oracle.not_created" style={{fontSize:"14px",color:"#999999"}}/></p>
                  <br/>
                  <Link className="button primary" to={`/account/${account_name}/create-oracle/`}>
                    <Translate content="seer.oracle.create" />
                  </Link>
                </div>

            }

          </div>
        </div>
      );
    }

    renderNeedInputTab(){
        let {account} = this.props;
        let {sortBy} = this.state;

      let rooms = _.clone(this.state.needOracleInputRooms);

        rooms = _.sortBy(rooms, [function(o) {
            if(sortBy === 0) {
                return o.id;
            }else if(sortBy === 1) {
                return o.option.filter.reputation;
            } else if(sortBy === 2) {
                return o.option.filter.guaranty;
            } else if(sortBy === 3) {
                return o.option.reward_per_oracle;
            }else{
                //最大奖励
                return o.option.reward_per_oracle;
            }
        }]);

        if(this.state.sortType === "desc"){
            rooms = rooms.reverse();
        }


      let roomRows = rooms.map(room=>{
          let localUTCTime = new Date().getTime() + new Date().getTimezoneOffset() * 60000;


          if(!( (new Date(room.option.stop).getTime() < localUTCTime )&&
              new Date(room.option.stop).getTime() + room.option.input_duration_secs * 1000 > localUTCTime ||
              new Date(room.option.stop).getTime() + room.option.input_duration_secs * 1000 < localUTCTime &&
              new Date(room.option.stop).getTime() + room.option.input_duration_secs * 1000 + 7 * 24 * 3600000 > localUTCTime &&
              (!room.owner_result || room.owner_result.length === 0) &&
              (!room.committee_result || room.committee_result.length === 0) &&
              (!room.oracle_sets || room.oracle_sets.length === 0))){

              return null;
          }


          return(
              <tr key={room.id}>
                <td>{room.id}</td>
                <td style={{lineHeight:"22px"}}><div>{room.description}</div></td>
                <td style={{lineHeight:"22px"}}>{room.option.filter.reputation}</td>
                <td style={{lineHeight:"22px"}}><FormattedAsset amount={room.option.filter.guaranty} asset={"1.3.0"}/></td>
                <td style={{lineHeight:"22px"}}><FormattedAsset amount={room.option.reward_per_oracle} asset={"1.3.0"}/></td>
                <td style={{lineHeight:"22px"}}><div>{moment.utc(room.option.start).local().format('YYYY-MM-DD HH:mm:ss')} - </div><div>{moment.utc(room.option.stop).local().format('YYYY-MM-DD HH:mm:ss')}</div></td>
                <td style={{color:room.status==="opening"?"#FB7704":"#666"}}>{room.status}</td>
                <td style={{textAlign:"right"}}>
                  <div className="nowrap">
                    <Link className="button tiny outline fillet" to={"prediction/rooms/" + room.id}><Translate content="seer.room.view"/></Link>
                    <button className="button tiny outline fillet" onClick={this.oracleInputRoom.bind(this, room)}>
                        <Translate content="seer.oracle.input"/>
                    </button>
                  </div>
                </td>
              </tr>
          );
      });
      
      return (
        <Tab title="seer.oracle.need_oracle_input_room">
          <div className="generic-bordered-box">
            <div className="box-content">
              { !this.state.isOracleInputting ?
                <table className="table table-hover dashboard-table">
                  <thead>
                  <tr>
                    <th width="100px" className={"clickable sort-container" + (this.state.sortBy === 0 ? " " + this.state.sortType : "")}
                        onClick={e => this.setState({sortBy:0,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
                        <div className="nowrap">
                            <Translate content="seer.room.room_id"/>
                            <Icon size="14px" name="sort"/>
                        </div>
                    </th>
                    <th><Translate content="seer.oracle.description"/></th>
                    <th className={"clickable sort-container" + (this.state.sortBy === 1 ? " " + this.state.sortType : "")}
                        onClick={e => this.setState({sortBy:1,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
                        <div className="nowrap">
                            <Translate content="seer.room.in_join_need_reputation"/>
                            <Icon size="14px" name="sort"/>
                        </div>
                    </th>
                    <th className={"clickable sort-container" + (this.state.sortBy === 2 ? " " + this.state.sortType : "")}
                        onClick={e => this.setState({sortBy:2,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
                        <div className="nowrap">
                            <Translate content="seer.room.in_join_need_guaranty"/>
                            <Icon size="14px" name="sort"/>
                        </div>
                    </th>
                    <th className={"clickable sort-container" + (this.state.sortBy === 3 ? " " + this.state.sortType : "")}
                        onClick={e => this.setState({sortBy:3,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
                        <div className="nowrap">
                            <Translate content="seer.room.reward_per_oracle"/>
                            <Icon size="14px" name="sort"/>
                        </div>
                    </th>
                    <th width="200px"><Translate content="seer.room.start_stop"/></th>
                    <th width="140px"><Translate content="seer.room.status"/></th>
                    <th style={{ textAlign: "right" }}><Translate content="account.witness.collateral.operation"/></th>
                  </tr>
                  </thead>
                  <tbody>
                  {roomRows}
                  </tbody>
                </table>
                :
                  <OracleInput room={this.state.current_room} account={account} onBack={()=>this.setState({isOracleInputting:false})}/>
              }
            </div>
          </div>
        </Tab>
      );
    }

    render() {
        let {account, account_name} = this.props;

        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        }
        if (!accountExists) {
            return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
        }

        return (
            <div className="app-tables no-padding" ref="appTables">

              {
                  this.state.oracle && this.state.oracle.id ?
                    <div ref="container" className="tabs-container generic-bordered-box">
                      <Tabs
                        setting="myOracleTab"
                        className="account-tabs"
                        defaultActiveTab={0}
                        segmented={false}
                        tabsClass="account-overview no-padding bordered-header content-block">

                        <Tab title="seer.oracle.my">
                          <div className="generic-bordered-box">
                            <div className="box-content">
                              {this.renderOracle.bind(this)()}
                            </div>
                          </div>
                        </Tab>

                        {this.renderNeedInputTab.bind(this)()}
                      </Tabs>
                    </div>
                    :
                    <div>
                      {this.renderOracle.bind(this)()}
                    </div>
              }

              <BaseModal id="issue_asset" overlay={true}>
                <br/>
                <div className="grid-block vertical">
                  <IssueModal
                    asset_to_issue={this.state.issue.asset_id}
                    onClose={() => {ZfApi.publish("issue_asset", "close");}}
                  />
                </div>
              </BaseModal>

              <BaseModal id="reserve_asset" overlay={true}>
                <br/>
                <div className="grid-block vertical">
                  <ReserveAssetModal
                    assetId={this.state.reserve}
                    account={account}
                    onClose={() => {ZfApi.publish("reserve_asset", "close");}}
                  />
                </div>
              </BaseModal>
            </div>
        );
    }
}

AccountOracle = BindToChainState(AccountOracle);

export default AccountOracle;