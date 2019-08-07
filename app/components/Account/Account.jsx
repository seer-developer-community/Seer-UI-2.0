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

        let accountName = this.props.account.get("name");

        return (
            <MenuContent
                menus={[
                    {
                        name: "/account/" + accountName + "/" + "dashboard",
                        text:"account.menus.account_all",
                        icon:"#icon-zhanghuzonglan"
                    },
                    {
                        name:"/account/" + accountName + "/" + "accounts",
                        text:"account.mine",
                        icon:"#icon-wodezhanghu"
                    },
                    {
                        name:"/account/" + accountName + "/" + "vesting",
                        text:"account.vesting.title",
                        icon:"#icon-daijiedongyue"
                    },
                    {
                        name:"/account/" + accountName + "/" + "assets",
                        text:"account.menus.asset_mangage",
                        icon:"#icon-zichanguanli"
                    },
                        "separator",
                    {
                        name:"/account/" + accountName + "/" + "assets1",
                        text:"account.menus.my_oracle",
                        icon:"#icon-wodeyuce"
                    },
                    {
                        name:"/account/" + accountName + "/" + "guaranty",
                        subURL:[
                          "account/" + accountName + "/create-oracle",
                          "account/" + accountName + "/update-house"
                        ],
                        text:"account.guaranty.title",
                        icon:"#icon-wodebaozhengjin"
                    },
                    {
                        name:"/account/" + accountName + "/" + "oracle",
                        subURL:[
                          "account/" + accountName + "/create-oracle",
                          "account/" + accountName + "/update-oracle"
                        ],
                        text:"seer.oracle.my",
                        icon:"#icon-wodeyuyanji"
                    },
                    {
                        name:"/account/" + accountName + "/" + "witness",
                        text:"account.witness.title",
                        icon:"#icon-wodejianzhengren"
                    },
                    "separator",
                    {
                        name:"/account/" + accountName + "/" + "erc20-gateway",
                        text:"gateway.gateway",
                        icon:"#icon-wangguan"
                    },
                    {
                        name:"/account/" + accountName + "/" + "member-stats",
                        text:"account.member.stats",
                        icon:"#icon-huiyuan"
                    },
                    {
                        name:"/account/" + accountName + "/" + "voting",
                        text:"account.voting",
                        icon:"#icon-toupiao"
                    },
                    "separator",
                    {
                        name:"/account/" + accountName + "/" + "assets8",
                        text:"account.menus.perm_mangage",
                        icon:"#icon-quanxianguanli"
                    },
                    {
                        name:"/account/" + accountName + "/" + "assets9",
                        text:"account.signedmessages.menuitem",
                        icon:"#icon-xiaoxiqianming"
                    },
                    {
                        name:"/account/" + accountName + "/" + "assets10",
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
