import React from "react";
import {Link} from "react-router/es";
import { connect } from "alt-react";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import SendModal from "../Modal/SendModal";
import DepositModal from "../Modal/DepositModal";
import GatewayStore from "stores/GatewayStore";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import WalletDb from "stores/WalletDb";
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletManagerStore from "stores/WalletManagerStore";
import cnames from "classnames";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import ReactTooltip from "react-tooltip";
import { Apis } from "seerjs-ws";
import notify from "actions/NotificationActions";
// import IntlActions from "actions/IntlActions";
import AccountImage from "../Account/AccountImage";
import {ChainStore} from "seerjs";
import IntlActions from "../../actions/IntlActions";

var logo = require("assets/logo-full.png");

const FlagImage = ({flag, width = 33, height = 20}) => {
  return <img height={height} width={width} src={`${__BASE_URL__}language-dropdown/${flag.toUpperCase()}.png`} />;
};

const SUBMENUS = {
    SETTINGS: "SETTINGS"
};

class HeaderNav extends React.Component {

    static contextTypes = {
        location: React.PropTypes.object.isRequired,
        router: React.PropTypes.object.isRequired
    };

    constructor(props, context) {
        super();
        this.state = {
            active: context.location.pathname,
            accountsListDropdownActive: false,
            locales: SettingsStore.getState().defaults.locale,
            currentLocale: SettingsStore.getState().settings.get("locale")
        };

        this.unlisten = null;
        this._toggleAccountDropdownMenu = this._toggleAccountDropdownMenu.bind(this);
        this._toggleDropdownMenu = this._toggleDropdownMenu.bind(this);
        this._closeDropdown = this._closeDropdown.bind(this);
        this._closeDropdownSubmenu = this._closeDropdownSubmenu.bind(this);
        this._toggleDropdownSubmenu = this._toggleDropdownSubmenu.bind(this);
        this._closeMenuDropdown = this._closeMenuDropdown.bind(this);
        this._closeAccountsListDropdown = this._closeAccountsListDropdown.bind(this);
        this.onBodyClick = this.onBodyClick.bind(this);
    }

    componentWillMount() {
        this.unlisten = this.context.router.listen((newState, err) => {
            if (!err) {
                if (this.unlisten && this.state.active !== newState.pathname) {
                    this.setState({
                        active: newState.pathname
                    });
                }
            }
        });
    }

    componentDidMount() {
        setTimeout(() => {
            ReactTooltip.rebuild();
        }, 1250);

        document.body.addEventListener("click", this.onBodyClick, {capture: false, passive: true});
    }

    componentWillUnmount() {
        if (this.unlisten) {
            this.unlisten();
            this.unlisten = null;
        }

        document.body.removeEventListener("click", this.onBodyClick);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.passwordLogin !== this.props.passwordLogin ||
            nextProps.locked !== this.props.locked ||
            nextProps.current_wallet !== this.props.current_wallet ||
            nextProps.lastMarket !== this.props.lastMarket ||
            nextProps.starredAccounts !== this.props.starredAccounts ||
            nextProps.currentLocale !== this.props.currentLocale ||
            nextState.active !== this.state.active ||
            nextState.hiddenAssets !== this.props.hiddenAssets ||
            nextState.dropdownActive !== this.state.dropdownActive ||
            nextState.dropdownSubmenuActive !== this.state.dropdownSubmenuActive ||
            nextState.accountsListDropdownActive !== this.state.accountsListDropdownActive ||
            nextProps.height !== this.props.height
        );
    }

    _showSend(e) {
        e.preventDefault();
        this.refs.send_modal.show();
        this._closeDropdown();
    }

    _showDeposit(e) {
        e.preventDefault();
        this.refs.deposit_modal_new.show();
        this._closeDropdown();
    }


    _triggerMenu(e) {
        e.preventDefault();
        ZfApi.publish("mobile-menu", "toggle");
    }

    _toggleLock(e) {
        e.preventDefault();
        if (WalletDb.isLocked()) {
            WalletUnlockActions.unlock().then(() => {
                AccountActions.tryToSetCurrentAccount();
            });
        } else {
            WalletUnlockActions.lock();
        }
        this._closeDropdown();
    }

    _onNavigate(route, e) {
        e.preventDefault();

        // Set Accounts Tab as active tab
        if(route == "/accounts") {
            SettingsActions.changeViewSetting({
                dashboardEntry: "accounts"
            });
        }

        this.context.router.push(route);
        this._closeDropdown();
    }

    _closeAccountsListDropdown() {
        this.setState({
            accountsListDropdownActive: false
        });
    }

    _closeMenuDropdown() {
        this.setState({
            dropdownActive: false,
        });
    }

    _closeDropdownSubmenu() {
        this.setState({
            dropdownSubmenuActive: false,
        });
    }

    _closeDropdown() {
        this._closeMenuDropdown();
        this._closeAccountsListDropdown();
        this._closeDropdownSubmenu();
    }

    _onGoBack(e) {
        e.preventDefault();
        window.history.back();
    }

    _onGoForward(e) {
        e.preventDefault();
        window.history.forward();
    }

    _accountClickHandler(account_name, e) {
        e.preventDefault();
        ZfApi.publish("account_drop_down", "close");
        if (this.context.location.pathname.indexOf("/account/") !== -1) {
            let currentPath = this.context.location.pathname.split("/");
            currentPath[2] = account_name;
            this.context.router.push(currentPath.join("/"));
        }
        if (account_name !== this.props.currentAccount) {
            AccountActions.setCurrentAccount.defer(account_name);
            notify.addNotification({
                message: counterpart.translate("header.account_notify", {account: account_name}),
                level: "success",
                autoDismiss: 2,
                position: "br"
            });
            this._closeDropdown();
        }
        // this.onClickUser(account_name, e);
    }

    // onClickUser(account, e) {
    //     e.stopPropagation();
    //     e.preventDefault();
    //
    //     this.context.router.push(`/account/${account}/overview`);
    // }

    _toggleAccountDropdownMenu() {

        // prevent state toggling if user cannot have multiple accounts

        const hasLocalWallet = !!WalletDb.getWallet();

        if (!hasLocalWallet)
            return false;

        this.setState({
            accountsListDropdownActive: !this.state.accountsListDropdownActive
        });
    }

    _toggleDropdownSubmenu(item = this.state.dropdownSubmenuActiveItem, e) {
        if (e) e.stopPropagation();

        this.setState({
            dropdownSubmenuActive: !this.state.dropdownSubmenuActive,
            dropdownSubmenuActiveItem: item
        });
    }

    _toggleDropdownMenu(e) {
        this.setState({
            dropdownActive: !this.state.dropdownActive
        });
    }

    onBodyClick(e) {
        let el = e.target;
        let insideMenuDropdown = false;
        let insideAccountDropdown = false;

        do {
            if(el.classList && el.classList.contains("account-dropdown-wrapper")) {
                insideAccountDropdown = true;
                break;
            }

            if(el.classList && el.classList.contains("menu-dropdown-wrapper")) {
                insideMenuDropdown = true;
                break;
            }

        } while ((el = el.parentNode));

        if(!insideAccountDropdown) this._closeAccountsListDropdown();
        if(!insideMenuDropdown) {
            this._closeMenuDropdown();
            this._closeDropdownSubmenu();
        }
    }

    _onLinkAccount() {
        AccountActions.linkAccount(this.props.currentAccount);
    }

    _onUnLinkAccount() {
        AccountActions.unlinkAccount(this.props.currentAccount);
    }

    render() {
        let {active} = this.state;
        let {currentAccount, starredAccounts, passwordLogin, passwordAccount, height} = this.props;

        let tradingAccounts = AccountStore.getMyAccounts();
        let maxHeight = Math.max(40, height - 67 - 36) + "px";

        const a = ChainStore.getAccount(currentAccount);
        const isMyAccount = !a ? false : (AccountStore.isMyAccount(a) || (passwordLogin && currentAccount === passwordAccount));
        const isContact = this.props.linkedAccounts.has(currentAccount);
        const enableDepositWithdraw = Apis.instance().chain_id.substr(0, 8) === "cea4fdf4" && isMyAccount;

        if (starredAccounts.size) {
            for (let i = tradingAccounts.length - 1; i >= 0; i--) {
                if (!starredAccounts.has(tradingAccounts[i])) {
                    tradingAccounts.splice(i, 1);
                }
            };
            starredAccounts.forEach(account => {
                if (tradingAccounts.indexOf(account.name) === -1) {
                    tradingAccounts.push(account.name);
                }
            });
        }


        let myAccounts = AccountStore.getMyAccounts();
        let myAccountCount = myAccounts.length;

        let walletBalance = myAccounts.length && this.props.currentAccount ? (
            <div className="total-value" >
                <TotalBalanceValue.AccountWrapper
                    hiddenAssets={this.props.hiddenAssets}
                    accounts={[this.props.currentAccount]}
                    noTip
                    style={{minHeight: 15}}
                />
            </div>) : null;

        let dashboard = (
            <a
                className={cnames("logo", {active: active === "/" || (active.indexOf("dashboard") !== -1 && active.indexOf("account") === -1)})}
                onClick={this._onNavigate.bind(this, "/")}
            >
                <img style={{margin: 0, height: 40}} src={logo} />
            </a>
        );

        let createAccountLink = myAccountCount === 0 ? (
            <ActionSheet.Button title="" setActiveState={() => {}}>
                <a className="button create-account" onClick={this._onNavigate.bind(this, "/create-account")} style={{padding: "1rem", border: "none"}} >
                    <Icon className="icon-14px" name="user"/> <Translate content="header.create_account" />
                </a>
            </ActionSheet.Button>
        ) : null;

        // let lock_unlock = ((!!this.props.current_wallet) || passwordLogin) ? (
        //     <div className="grp-menu-item" >
        //     { this.props.locked ?
        //         <a style={{padding: "1rem"}} href onClick={this._toggleLock.bind(this)} data-class="unlock-tooltip" data-offset="{'left': 50}" data-tip={locked_tip} data-place="bottom" data-html><Icon className="icon-14px" name="locked"/></a>
        //         : <a style={{padding: "1rem"}} href onClick={this._toggleLock.bind(this)} data-class="unlock-tooltip" data-offset="{'left': 50}" data-tip={unlocked_tip} data-place="bottom" data-html><Icon className="icon-14px" name="unlocked"/></a> }
        //     </div>
        // ) : null;

        let tradeUrl = this.props.lastMarket ? `/market/${this.props.lastMarket}` : "/market/PFC_SEER";

        // Account selector: Only active inside the exchange
        let account_display_name, accountsList;
        if (currentAccount) {
            account_display_name = currentAccount.length > 20 ? `${currentAccount.slice(0, 20)}..` : currentAccount;
            if (tradingAccounts.indexOf(currentAccount) < 0 && isMyAccount) {
                tradingAccounts.push(currentAccount);
            }
            if (tradingAccounts.length >= 1) {
                accountsList = tradingAccounts
                .sort()
                .filter((name) => name !== currentAccount)
                .map((name) => {
                    return (
                        <li key={name} className={cnames({active: active.replace("/account/", "").indexOf(name) === 0})} onClick={this._accountClickHandler.bind(this, name)}>
                            <div style={{paddingTop: 0}} className="table-cell"><AccountImage style={{position: "relative", top: 4}} size={{height: 20, width: 20}} account={name}/></div>
                            <div className="table-cell" style={{paddingLeft: 10}}><a className={"lower-case" + (name === account_display_name ? " current-account" : "")}>{name}</a></div>
                        </li>
                    );
                });
            }
        }

        let hamburger = this.state.dropdownActive ? <Icon className="icon-14px" name="hamburger-x" /> : <Icon className="icon-14px" name="hamburger" />;
        const hasLocalWallet = !!WalletDb.getWallet();

        const submenus = {
            [SUBMENUS.SETTINGS]: (
                <ul className="dropdown header-menu header-submenu" style={{
                    left: -200,
                    top: 64,
                    maxHeight: !this.state.dropdownActive ? 0 : maxHeight,
                    overflowY: "auto"
                }}>
                    <li className="divider parent-item" onClick={this._toggleDropdownSubmenu.bind(this, undefined)}>
                        <div className="table-cell">
                            <span className="parent-item-icon">&lt;</span>
                            <Translate content="header.settings" component="span" className="parent-item-name"/>
                        </div>
                    </li>
                    <li onClick={this._onNavigate.bind(this, "/settings/general")}>
                        <Translate content="settings.general" component="div" className="table-cell"/>
                    </li>
                    { !this.props.settings.get("passwordLogin") && (
                        <li onClick={this._onNavigate.bind(this, "/settings/wallet")}>
                            <Translate content="settings.wallet" component="div" className="table-cell"/>
                        </li>
                    )}
                    <li onClick={this._onNavigate.bind(this, "/settings/accounts")}>
                        <Translate content="settings.accounts" component="div" className="table-cell"/>
                    </li>

                    {!this.props.settings.get("passwordLogin") && (
                        [
                            <li key={"settings.password"} onClick={this._onNavigate.bind(this, "/settings/password")}>
                                <Translate content="settings.password" component="div" className="table-cell"/>
                            </li>,
                            <li key={"settings.backup"} onClick={this._onNavigate.bind(this, "/settings/backup")}>
                                <Translate content="settings.backup" component="div" className="table-cell"/>
                            </li>
                        ]
                    )}
                    <li onClick={this._onNavigate.bind(this, "/settings/restore")}>
                        <Translate content="settings.restore" component="div" className="table-cell"/>
                    </li>
                    <li onClick={this._onNavigate.bind(this, "/settings/access")}>
                        <Translate content="settings.access" component="div" className="table-cell"/>
                    </li>
                    <li onClick={this._onNavigate.bind(this, "/settings/faucet_address")}>
                        <Translate content="settings.faucet_address" component="div" className="table-cell"/>
                    </li>
                    <li onClick={this._onNavigate.bind(this, "/settings/reset")}>
                        <Translate content="settings.reset" component="div" className="table-cell"/>
                    </li>
                </ul>
            )
        };

      const flagDropdown = <ActionSheet id="intl-sheet">
        <ActionSheet.Button title="" style={{width:"64px"}}>
          <a className="arrow-down">
            <FlagImage flag={this.state.currentLocale} />
          </a>
        </ActionSheet.Button>
        <ActionSheet.Content>
          <ul className="no-first-element-top-border">
            {this.state.locales.map(locale => {
              return (
                <li key={locale}>
                  <a href onClick={(e) => {e.preventDefault(); IntlActions.switchLocale(locale); this.setState({currentLocale: locale});}}>
                    <div className="table-cell"><FlagImage width="20" height="20" flag={locale} /></div>
                    <div className="table-cell" style={{paddingLeft: 10}}><Translate content={"languages." + locale} /></div>
                  </a>
                </li>
              );
            })}
          </ul>
        </ActionSheet.Content>
      </ActionSheet>;

        return (
            <div className="header-container light" style={{minHeight:"59px"}}>
                <div>
                    <div className="header menu-group primary" style={{flexWrap:"nowrap", justifyContent:"none"}}>
                        {__ELECTRON__ ? <div className="grid-block show-for-medium shrink electron-navigation">
                            <ul className="menu-bar">
                                <li>
                                    <div style={{marginLeft: "1rem", height: "3rem"}}>
                                        <div style={{marginTop: "0.5rem"}} onClick={this._onGoBack.bind(this)} className="button outline small">{"<"}</div>
                                    </div>
                                </li>
                                <li>
                                    <div style={{height: "3rem", marginLeft: "0.5rem", marginRight: "0.75rem"}}>
                                        <div style={{marginTop: "0.5rem"}} onClick={this._onGoForward.bind(this)} className="button outline small">></div>
                                    </div>
                                </li>
                            </ul>
                        </div> : null}

                        <ul className="menu-bar">
                            <li style={{paddingRight:"40px"}}>{dashboard}</li>

                            <li>
                                <a style={{flexFlow: "row"}} className={cnames((active === "/" || active.indexOf("prediction") !== -1) ? null : "column-hide-xs", {active: (active.indexOf("prediction") !== -1 || active === "/")})} onClick={this._onNavigate.bind(this, "/prediction")}>
                                    <Translate className="column-hide-small" component="span" content="header.prediction" />
                                </a>
                            </li>
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("market") !== -1 ? null : "column-hide-xs", {active: active.indexOf("market") !== -1})} onClick={this._onNavigate.bind(this, tradeUrl)}>
                                    <Translate className="column-hide-small" component="span" content="header.exchange" />
                                </a>
                            </li>
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("explorer") !== -1 ? null : "column-hide-xs", {active: active.indexOf("explorer") !== -1})} onClick={this._onNavigate.bind(this, "/explorer")}>
                                    <Translate className="column-hide-small" component="span" content="header.explorer" />
                                </a>
                            </li>
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("wallet") !== -1 ? null : "column-hide-xs", {active: active.indexOf("wallet") !== -1})} onClick={this._onNavigate.bind(this, "/settings")}>
                                    <Translate className="column-hide-small" component="span" content="header.wallet_manage" />
                                </a>
                            </li>
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("account") !== -1 ? null : "column-hide-xs", {active: active.indexOf("account") !== -1})} onClick={this._onNavigate.bind(this, "/account/" + (currentAccount || ""))}>
                                    <Translate className="column-hide-small" component="span" content="header.account_manage" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
              <div className="truncated" >&nbsp;</div>
              {
                (!hasLocalWallet || !currentAccount) &&
                <div style={{textAlign: "right",paddingRight:10}}>
                  <i className="iconfont icon-qianbao1" style={{color:"#449E7B"}}></i>&nbsp;&nbsp;
                  <Link to={"/create-account/wallet"}><Translate content="account.create_wallet" style={{fontSize:16,color:"#666"}}/></Link>
                </div>
              }
              {
                hasLocalWallet && currentAccount && isMyAccount &&
                <div style={{ textAlign: "right", paddingRight: 10 }}>
                  <i className="iconfont icon-chuangjian2" style={{ color: "#449E7B" }}></i>&nbsp;&nbsp;
                  <Link to={"/account/" + currentAccount + "/create-room/single=false"}><Translate content="seer.room.create" style={{ fontSize: 16, color: "#666" }}/></Link>
                </div>
              }
              {
                !isMyAccount &&
                <div style={{ textAlign: "right", paddingRight: 10 }}>
                  <i className="iconfont icon-tishi2" style={{ color: "#449E7B" }}></i>&nbsp;&nbsp;
                  <Translate content="account.observer_model" style={{ fontSize: 16, color: "#666" }}/>
                </div>
              }
                <div onClick={this._toggleAccountDropdownMenu} className="active-account" style={{"cursor": "pointer"}}>
                  { !!currentAccount ?
                    <div className="text account-name flex-align-middle">
                        <span onClick={this._toggleLock.bind(this)} style={{"cursor": "pointer"}}>
                            <Icon className="lock-unlock" size="24px" name={this.props.locked ? "locked" : "unlocked"}/>
                        </span>
                        {currentAccount}
                        &nbsp;
                        <span style={{display:"inline-block",transform:"rotate(-45deg)",position:"relative",top:-2}}>◣</span>
                     </div>
                    : null
                  }

                    {hasLocalWallet && (
                        <ul className="dropdown header-menu local-wallet-menu" style={{right: 0, maxHeight: !this.state.accountsListDropdownActive ? 0 : maxHeight, overflowY: "auto", position:"absolute",width:"200px"}}>
                            <li className={cnames({active: active.indexOf("/accounts") !== -1}, "divider")} onClick={this._onNavigate.bind(this, "/accounts")}>
                                <div className="table-cell"><Icon size="2x" name="folder" /></div>
                                <div className="table-cell"><Translate content="explorer.accounts.title" /></div>
                            </li>
                            {accountsList}
                        </ul>
                    )}
                </div>
                {flagDropdown}

                <SendModal id="send_modal_header"
                    ref="send_modal"
                    from_name={currentAccount} />

                <DepositModal
                    ref="deposit_modal_new"
                    modalId="deposit_modal_new"
                    account={currentAccount}
                    backedCoins={this.props.backedCoins} />
            </div>
        );

    }
}

export default connect(HeaderNav, {
    listenTo() {
        return [AccountStore, WalletUnlockStore, WalletManagerStore, SettingsStore, GatewayStore];
    },
    getProps() {
        const chainID = Apis.instance().chain_id;
        return {
            backedCoins: GatewayStore.getState().backedCoins,
            linkedAccounts: AccountStore.getState().linkedAccounts,
            currentAccount: AccountStore.getState().currentAccount || AccountStore.getState().passwordAccount,
            passwordAccount: AccountStore.getState().passwordAccount,
            locked: WalletUnlockStore.getState().locked,
            current_wallet: WalletManagerStore.getState().current_wallet,
            lastMarket: SettingsStore.getState().viewSettings.get(`lastMarket${chainID ? ("_" + chainID.substr(0, 8)) : ""}`),
            starredAccounts: AccountStore.getState().starredAccounts,
            passwordLogin: SettingsStore.getState().settings.get("passwordLogin"),
            currentLocale: SettingsStore.getState().settings.get("locale"),
            hiddenAssets: SettingsStore.getState().hiddenAssets,
            settings: SettingsStore.getState().settings,
            locales: SettingsStore.getState().defaults.locale
        };
    }
});
