import React from "react";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import GatewayStore from "stores/GatewayStore";
// import AccountLeftPanel from "./AccountLeftPanel";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import { connect } from "alt-react";
import accountUtils from "common/account_utils";
import MenuContent from "../Layout/MenuContent"



//
import AccountPage from "./AccountPage"
import DashboardAccountsOnly from "../Dashboard/DashboardAccountsOnly"
import AccountAssets from "./AccountAssets"
import AccountGuaranty from "./AccountGuaranty";

class Account extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        account: "props.params.account_name"
    };

    componentDidMount() {
        if (this.props.account) {
            AccountActions.setCurrentAccount.defer(this.props.account.get("name"));
        }

        // Fetch possible fee assets here to avoid async issues later (will resolve assets)
        accountUtils.getPossibleFees(this.props.account, "transfer");
    }

    componentWillReceiveProps(np) {
        if (np.account) {
            AccountActions.setCurrentAccount.defer(np.account.get("name"));
        }
    }

    render() {
        let {linkedAccounts, account_name, searchAccounts, settings, wallet_locked, account, hiddenAssets} = this.props;

        let isMyAccount = AccountStore.isMyAccount(account);

        return (
            <MenuContent
                menus={[
                    {
                        name: "/account/" + account_name + "/" + "dashboard",
                        text: "account.menus.account_all",
                        icon:"#icon-zhanghuzonglan"
                    },
                    {
                        name:"/account/" + account_name + "/" + "accounts",
                        subURL:[
                          "account/" + account_name + "/history",
                          "account/" + account_name + "/contacts"
                        ],
                        text: isMyAccount ? "account.mine" : "account.ta",
                        icon:"#icon-wodezhanghu"
                    },
                    {
                        name:"/account/" + account_name + "/" + "vesting",
                        text:"account.vesting.title",
                        icon:"#icon-daijiedongyue"
                    },
                    {
                        name:"/account/" + account_name + "/" + "assets",
                        subURL:[
                            "account/" + account_name + "/create-asset",
                        ],
                        text:"account.menus.asset_mangage",
                        icon:"#icon-zichanguanli"
                    },
                        "separator",
                    {
                        name:"/account/" + account_name + "/" + "prediction",
                        text: isMyAccount ? "account.menus.my_oracle" : "account.menus.ta_oracle",
                        icon:"#icon-wodeyuce"
                    },
                    {
                        name:"/account/" + account_name + "/" + "guaranty",
                        subURL:[
                          "account/" + account_name + "/create-oracle",
                          "account/" + account_name + "/update-house"
                        ],
                        text: isMyAccount ? "account.menus.my_guaranty" : "account.menus.ta_guaranty",
                        icon:"#icon-wodebaozhengjin"
                    },
                    {
                        name:"/account/" + account_name + "/" + "oracle",
                        subURL:[
                          "account/" + account_name + "/create-oracle",
                          "account/" + account_name + "/update-oracle"
                        ],
                        text: isMyAccount ? "seer.oracle.my" : "seer.oracle.ta",
                        icon:"#icon-wodeyuyanji"
                    },
                    {
                        name:"/account/" + account_name + "/" + "witness",
                        text: isMyAccount ? "account.menus.my_witness" : "account.menus.ta_witness",
                        icon:"#icon-wodejianzhengren"
                    },
                    "separator",
                    {
                        name:"/account/" + account_name + "/" + "erc20-gateway",
                        text:"gateway.gateway",
                        icon:"#icon-wangguan"
                    },
                    {
                        name:"/account/" + account_name + "/" + "member-stats",
                        text:"account.member.stats",
                        icon:"#icon-huiyuan"
                    },
                    {
                        name:"/account/" + account_name + "/" + "voting",
                        text:"account.voting",
                        icon:"#icon-toupiao"
                    },
                    "separator",
                    {
                        name:"/account/" + account_name + "/" + "permissions",
                        text:"account.menus.perm_mangage",
                        icon:"#icon-quanxianguanli"
                    },
                    {
                        name:"/account/" + account_name + "/" + "signedmessages",
                        text:"account.signedmessages.menuitem",
                        icon:"#icon-xiaoxiqianming"
                    },
                    {
                        name:"/account/" + account_name + "/" + "whitelist",
                        text:"account.menus.black_white_list",
                        icon:"#icon-heibaimingdan"
                    }
                ]}
                {...this.props}
            />
        )


        return (
            <div className="grid-block page-layout">
                {/* <div className="show-for-medium grid-block shrink left-column no-padding" style={{minWidth: 200}}>
                    <AccountLeftPanel
                        account={account}
                        isMyAccount={isMyAccount}
                        linkedAccounts={linkedAccounts}
                        myAccounts={myAccounts}
                        viewSettings={this.props.viewSettings}
                        passwordLogin={settings.get("passwordLogin")}
                    />
                </div> */}
                    <div className="grid-block no-padding">
                    {React.cloneElement(
                        React.Children.only(this.props.children),
                        {
                            account_name,
                            linkedAccounts,
                            searchAccounts,
                            settings,
                            wallet_locked,
                            account,
                            isMyAccount,
                            hiddenAssets,
                            contained: true,
                            balances: account.get("balances", null),
                            orders: account.get("orders", null),
                            backedCoins: this.props.backedCoins,
                            bridgeCoins: this.props.bridgeCoins,
                            gatewayDown: this.props.gatewayDown,
                            viewSettings: this.props.viewSettings,
                            proxy: account.getIn(["options", "voting_account"])
                        }
                    )}
                    </div>
            </div>
        );
    }
}
Account = BindToChainState(Account, {keep_updating: true, show_loader: true});

class AccountPageStoreWrapper extends React.Component {
    render () {
        let account_name = this.props.routeParams.account_name;

        return <Account {...this.props} account_name={account_name}/>;
    }
}

export default connect(AccountPageStoreWrapper, {
    listenTo() {
        return [AccountStore, SettingsStore, WalletUnlockStore, GatewayStore];
    },
    getProps() {
        return {
            linkedAccounts: AccountStore.getState().linkedAccounts,
            searchAccounts: AccountStore.getState().searchAccounts,
            settings: SettingsStore.getState().settings,
            hiddenAssets: SettingsStore.getState().hiddenAssets,
            wallet_locked: WalletUnlockStore.getState().locked,
            viewSettings: SettingsStore.getState().viewSettings,
            backedCoins: GatewayStore.getState().backedCoins,
            bridgeCoins: GatewayStore.getState().bridgeCoins,
            gatewayDown: GatewayStore.getState().down
        };
    }
});
