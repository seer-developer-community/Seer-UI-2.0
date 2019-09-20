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
            awardsGt:SettingsStore.getState().settings.get("room_notice_awards_gt"),
            awardsGtEditable:false,
            endTime:SettingsStore.getState().settings.get("room_notice_end_time_lt"),
            endTimeEditable:false,
        };


    }

    componentWillMount() {
        Apis.instance().db_api().exec("get_oracle_by_account", [this.props.account.get("id")]).then((results) => {
            this.setState({oracle: results})
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

    _onAwardsGtEditClick(){
        if(this.state.awardsGtEditable){
            SettingsActions.changeSetting({
                setting : "room_notice_awards_gt", value : this.state.awardsGt
            });
        }
        this.setState({awardsGtEditable:!this.state.awardsGtEditable})
    }

    _onEndTimeEditClick(){
        if(this.state.endTimeEditable){
            SettingsActions.changeSetting({
                setting : "room_notice_end_time_lt", value : this.state.endTime
            });
        }
        this.setState({endTimeEditable:!this.state.endTimeEditable})
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
            <div className="grid-content app-tables no-padding" ref="appTables">
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
                                                                    <input type="text" style={{display:"inline-block",width:80,height:22,margin:0,padding:"0 3px",fontSize:14,borderColor:"#4BA180"}} value={this.state.awardsGt} onChange={e=>this.setState({awardsGt:e.target.value})}/>
                                                                        :
                                                                    <input type="text" style={{display:"inline-block",width:80,height:22,margin:0,padding:"0 3px",fontSize:14}} disabled={true} value={this.state.awardsGt}/>
                                                                }
                                                                &nbsp;&nbsp;&nbsp;&nbsp;SEER
                                                                &nbsp;&nbsp;&nbsp;&nbsp;
                                                                <a onClick={this._onAwardsGtEditClick.bind(this)}>
                                                                    <Translate content={this.state.awardsGtEditable ? "confirm" : "seer.oracle.remind_update"}/>
                                                                </a>
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
                                                                        <input type="text" style={{display:"inline-block",width:80,height:22,margin:0,padding:"0 3px",fontSize:14,borderColor:"#4BA180"}} value={this.state.endTime} onChange={e=>this.setState({endTime:e.target.value})}/>
                                                                        :
                                                                        <input type="text" style={{display:"inline-block",width:80,height:22,margin:0,padding:"0 3px",fontSize:14}} disabled={true} value={this.state.endTime}/>
                                                                }
                                                                &nbsp;&nbsp;&nbsp;&nbsp;MIN
                                                                &nbsp;&nbsp;&nbsp;&nbsp;
                                                                <a onClick={this._onEndTimeEditClick.bind(this)}>
                                                                    <Translate content={this.state.endTimeEditable ? "confirm" : "seer.oracle.remind_update"}/>
                                                                </a>
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
            </div>
        );
    }
}

AccountOracle = BindToChainState(AccountOracle);

export default AccountOracle;