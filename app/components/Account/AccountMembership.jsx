import React from "react";
import {Link} from "react-router/es";
import Translate from "react-translate-component";
import {ChainStore} from "seerjs/es";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Statistics from "./Statistics";
import AccountActions from "actions/AccountActions";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import accountUtils from "common/account_utils";
import {CopyToClipboard} from 'react-copy-to-clipboard';

class FeeHelp extends React.Component {
    static propTypes = {
        dprops: ChainTypes.ChainObject.isRequired
    };
    static defaultProps = {
        dprops: "2.1.0"
    };

    render() {
        let {dprops} = this.props;

        return (
            <HelpContent
                {...this.props}
                path="components/AccountMembership"
                section="fee-division"
                nextMaintenanceTime={{time: dprops.get("next_maintenance_time")}}
            />
        );
    }
}
FeeHelp = BindToChainState(FeeHelp);

class AccountMembership extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        gprops: ChainTypes.ChainObject.isRequired,
        core_asset: ChainTypes.ChainAsset.isRequired
    };
    static defaultProps = {
        gprops: "2.0.0",
        core_asset: "1.3.0"
    };

    upgradeAccount(id, lifetime, e) {
        e.preventDefault();
        AccountActions.upgradeAccount(id, lifetime);
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "account_upgrade");
    }

    render() {

        let {gprops, core_asset} = this.props;

        let account = this.props.account.toJS();

        let ltr = ChainStore.getAccount( account.lifetime_referrer, false );
        if( ltr ) account.lifetime_referrer_name = ltr.get("name");
        let ref = ChainStore.getAccount( account.referrer, false );
        if( ref ) account.referrer_name = ref.get("name");
        let reg = ChainStore.getAccount( account.registrar, false );
        if( reg ) account.registrar_name = reg.get("name");

        let account_name = account.name;

        let network_fee  = account.network_fee_percentage/100;
        let lifetime_fee = account.lifetime_referrer_fee_percentage/100;
        let referrer_total_fee = 100 - network_fee - lifetime_fee;
        let referrer_fee  = referrer_total_fee * account.referrer_rewards_percentage/10000;
        let registrar_fee = 100 - referrer_fee - lifetime_fee - network_fee;

        let lifetime_cost = gprops.getIn(["parameters", "current_fees", "parameters", 8, 1, "membership_lifetime_fee"]) * gprops.getIn(["parameters", "current_fees", "scale"]) / 10000;

        let member_status = ChainStore.getAccountMemberStatus(this.props.account);
        let membership = "account.member." + member_status;
        let expiration = null;
        if( member_status === "annual" )
            expiration = (<span>(<Translate content="account.member.expires"/> <TimeAgo time={account.membership_expiration_date} />)</span>);
        let expiration_date = account.membership_expiration_date;
        if( expiration_date === "1969-12-31T23:59:59" )
            expiration_date = "Never";
        else if( expiration_date === "1970-01-01T00:00:00" )
            expiration_date = "N/A";

        let className = member_status === "lifetime" ? "lifetime" : "";

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className={"content-block small-12 member " + className} style={{marginTop:"48px"}}>
                    <h3 className="member-title">
                      <svg className="icon" aria-hidden="true" style={{width:"50px",height:"39.12px",marginRight:"14px"}}>
                        <use xlinkHref={member_status=== "lifetime" ? "#icon-tubiao-huiyuan-lifttime" : "#icon-tubiao-huiyuan"}></use>
                      </svg>
                      <Translate content={membership}/> {expiration}
                      </h3>

                    { member_status=== "lifetime" ? (
                      <div>
                        <h4 style={{fontSize:"18px",color:"#333",fontWeight:"bold",marginTop:"54px"}}><Translate content="account.member.referral_link"/></h4>
                          <div style={{display:"flex",alignItems:"center",marginBottom:"1rem"}}>
                            <input id="copy-link" type="text" value={`https://www.seer.best/?r=${account.name}`} style={{width:"37.5em",color:"#666",margin:"0 1rem 0 0"}}/>

                            <CopyToClipboard text={`https://www.seer.best/?r=${account.name}`}>
                              <Translate content="account.member.copy_link" style={{fontSize:"14px",color:"#449E7B",cursor:"pointer"}}/>
                            </CopyToClipboard>
                          </div>
                            <Translate content="account.member.referral_text" style={{fontSize:"14px",color:"#666"}}/>
                      </div>
                      ) : (
                    <div>
                        <HelpContent path="components/AccountMembership" section="lifetime" feesCashback={100 - network_fee} price={{amount: lifetime_cost, asset: core_asset}}/>

                      <button onClick={this.upgradeAccount.bind(this, account.id, true)} className="button primary" style={{marginTop:"16px"}}>
                        <Translate content="account.member.upgrade_lifetime"/>
                      </button>
                      &nbsp; &nbsp;
                        {true || member_status === "annual" ? null :
                          <button onClick={this.upgradeAccount.bind(this, account.id, false)} className="button primary" style={{marginTop:"16px"}}>
                            <Translate content="account.member.subscribe"/>
                          </button>
                        }
                    </div>
                    )}

                                <div className="content-block no-margin" style={{padding:"75px 0 0 0"}}>
                                    <div className="no-margin grid-block vertical large-horizontal">
                                        <div className="no-margin grid-block large-6">
                                            <div className="grid-content" style={{padding:"0 15px 0 0"}}>
                                                <h5 className="table-title"><Translate content="account.member.fee_allocation"/></h5>
                                                <table className="table key-value-table">
                                                    <tbody>
                                                        <tr>
                                                            <td><Translate content="account.member.network_percentage"/></td>
                                                            <td>{network_fee}%</td>
                                                        </tr>
                                                        <tr>
                                                            <td><Translate content="account.member.lifetime_referrer"/>  &nbsp;
                                                            (<Link to={`account/${account.lifetime_referrer_name}/overview`}>{account.lifetime_referrer_name}</Link>)
                                                            </td>
                                                            <td>{lifetime_fee}%</td>
                                                        </tr>
                                                        <tr>
                                                            <td><Translate content="account.member.registrar"/>  &nbsp;
                                                            (<Link to={`account/${account.registrar_name}/overview`}>{account.registrar_name}</Link>)
                                                            </td>
                                                            <td>{registrar_fee}%</td>
                                                        </tr>
                                                        <tr>
                                                            <td><Translate content="account.member.referrer"/>  &nbsp;
                                                            (<Link to={`account/${account.referrer_name}/overview`}>{account.referrer_name }</Link>)
                                                            </td>
                                                            <td>{referrer_fee}%</td>
                                                        </tr>
                                                        <tr>
                                                            <td><Translate content="account.member.membership_expiration"/> </td>
                                                            <td>{expiration_date}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>


                                            </div>
                                        </div>
                                        <div className="no-margin grid-block large-6">
                                            <div className="grid-content" style={{padding:"0 0 0 15px"}}>
                                              <h5 className="table-title"><Translate content="account.member.fees_cashback"/></h5>
                                              <table className="table key-value-table">
                                                <Statistics stat_object={account.statistics}/>
                                              </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                  <div className="fee-help">
                      <FeeHelp
                        account={account_name}
                        networkFee={network_fee}
                        referrerFee={referrer_fee}
                        registrarFee={registrar_fee}
                        lifetimeFee={lifetime_fee}
                        referrerTotalFee={referrer_total_fee}
                        maintenanceInterval={gprops.getIn(["parameters", "maintenance_interval"])}
                        vestingThreshold={{amount: gprops.getIn(["parameters", "cashback_vesting_threshold"]) , asset: core_asset}}
                        vestingPeriod={gprops.getIn(["parameters", "cashback_vesting_period_seconds"]) /60/60/24}
                      />
                  </div>
                </div>
            </div>
        );
    }
}
AccountMembership = BindToChainState(AccountMembership);

export default AccountMembership;
