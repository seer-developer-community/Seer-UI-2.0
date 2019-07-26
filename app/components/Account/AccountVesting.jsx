import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import {ChainStore} from "seerjs/es";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import {Apis} from "seerjs-ws";
import {Tabs, Tab} from "../Utility/Tabs";

class VestingBalance extends React.Component {

    _onClaim(claimAll, e) {
        e.preventDefault();
        WalletActions.claimVestingBalance(this.props.account.id, this.props.vb, claimAll).then(() => {
            typeof this.props.handleChanged == 'function' && this.props.handleChanged();
        });
    }

    render() {
        let {vb} = this.props;
        if (!this.props.vb) {
            return null;
        }

        let cvbAsset, vestingPeriod, earned, secondsPerDay = 60 * 60 * 24,
            availablePercent, balance;
        if (vb) {
            balance = vb.balance.amount;
            cvbAsset = ChainStore.getAsset(vb.balance.asset_id);
            earned = vb.policy[1].coin_seconds_earned;
            vestingPeriod = vb.policy[1].vesting_seconds;

            if(vestingPeriod === 0){
                availablePercent = 1;
            }
            else{
                var localUTCTime = new Date().getTime() + new Date().getTimezoneOffset()*60000;
                var delta_seconds = parseInt((localUTCTime  -new Date(vb.policy[1].coin_seconds_earned_last_update).getTime())/1000);

                var delta_coin_seconds = parseFloat(balance);
                delta_coin_seconds *= delta_seconds;

                var withdraw_available = (parseFloat(earned) + delta_coin_seconds) / vestingPeriod

                if(withdraw_available > balance)
                    withdraw_available = balance

                availablePercent = withdraw_available / balance;
            }
        }

        if (!cvbAsset) {
            return null;
        }

        if (!balance) {
            return null;
        }

        return (
            <div>
                <Translate component="h5" content="account.vesting.balance_number" id={vb.id} style={{fontSize: "14px",color: "#666",marginTop:"52px",marginBottom:"42px"}}/>

                <table className="table key-value-table">
                    <tbody>
                    <tr>
                        <td><Translate content="account.member.cashback"/></td>
                        <td><FormattedAsset amount={vb.balance.amount} asset={vb.balance.asset_id}/></td>
                    </tr>
                    <tr>
                        <td><Translate content="account.member.earned"/></td>
                        <td>{utils.format_number(utils.get_asset_amount(earned / secondsPerDay, cvbAsset), 0)}
                            &nbsp;<Translate content="account.member.coindays"/></td>
                    </tr>
                    <tr>
                        <td><Translate content="account.member.required"/></td>
                        <td>{utils.format_number(utils.get_asset_amount(vb.balance.amount * vestingPeriod / secondsPerDay, cvbAsset), 0)}
                            &nbsp;<Translate content="account.member.coindays"/></td>
                    </tr>
                    <tr>
                        <td><Translate content="account.member.remaining"/></td>
                        <td>{utils.format_number(vestingPeriod * (1 - availablePercent) / secondsPerDay || 0, 2)}
                            &nbsp;days
                        </td>
                    </tr>
                    <tr>
                        <td><Translate content="account.member.available"/></td>
                        <td>{utils.format_number(availablePercent * 100, 2)}% / <FormattedAsset
                            amount={availablePercent * vb.balance.amount} asset={cvbAsset.get("id")}/></td>
                    </tr>
                    </tbody>
                </table>
                <button onClick={this._onClaim.bind(this, false)} className="button primary" style={{marginTop:"48px"}}>
                    <Translate content="account.member.claim"/>
                </button>
            </div>
        );
    }
}

class AccountVesting extends React.Component {
    constructor() {
        super();

        this.state = {
            vbs: null
        };
    }

    componentWillMount() {
        this.retrieveVestingBalances.call(this, this.props.account.get("id"));
    }

    componentWillUpdate(nextProps) {
        let newId = nextProps.account.get("id");
        let oldId = this.props.account.get("id");

        if (newId !== oldId) {
            this.retrieveVestingBalances.call(this, newId);
        }
    }

    retrieveVestingBalances(accountId) {
        accountId = accountId || this.props.account.get("id");
        Apis.instance().db_api().exec("get_vesting_balances", [
            accountId
        ]).then(vbs => {
            this.setState({vbs});
        }).catch(err => {
            console.log("error:", err);
        });
    }

    render() {
        let {vbs} = this.state;
        if (!vbs || !this.props.account || !this.props.account.get("vesting_balances")) {
            return null;
        }

        let account = this.props.account.toJS();

        let balances = vbs.map(vb => {
            if (vb.balance.amount) {
                return <VestingBalance key={vb.id} vb={vb} account={account}
                                       handleChanged={this.retrieveVestingBalances.bind(this)}/>;
            }
        }).filter(a => {
            return !!a;
        });

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12" style={{paddingTop:"34px"}}>
                  <Translate content="account.vesting.title" component="h5" style={{fontWeight:"bold"}}/>
                  <Translate content="account.vesting.explain" component="p" style={{fontSize:"14px",color:"#999"}}/>

                  {!balances.length ? (
                    <h4 style={{paddingTop: "1rem"}}>
                      <Translate content={"account.vesting.no_balances"}/>
                    </h4>) : balances}
                </div>
            </div>    
        );
    }
}

AccountVesting.VestingBalance = VestingBalance;
export default AccountVesting;
