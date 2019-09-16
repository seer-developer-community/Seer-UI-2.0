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
import SearchApi from "api/SearchApi";
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

class HeaderExplorer extends React.Component {

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
            currentLocale: SettingsStore.getState().settings.get("locale"),
            searchKey: "",
            searchResult:[]
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

        this.setState({
          searchResult:[]
        })
    }

    _onLinkAccount() {
        AccountActions.linkAccount(this.props.currentAccount);
    }

    _onUnLinkAccount() {
        AccountActions.unlinkAccount(this.props.currentAccount);
    }

    _onSearchKeyDown(e){
        if (e.key === 'Enter') {
          this._doSearch(this.state.searchKey);
        }
    }

    _doSearch(key){
      SearchApi.search(key).then(res=>{
          this.setState({
            searchResult:res
          });
      })
    }

    render() {
        let {active} = this.state;
        let {currentAccount, starredAccounts, passwordLogin, passwordAccount, height} = this.props;

        let tradingAccounts = AccountStore.getMyAccounts();
        let maxHeight = Math.max(40, height - 67 - 36) + "px";

        const a = ChainStore.getAccount(currentAccount);
        const isMyAccount = !a ? false : (AccountStore.isMyAccount(a) || (passwordLogin && currentAccount === passwordAccount));
        const isContact = this.props.linkedAccounts.has(currentAccount);
        const enableDepositWithdraw = Apis.instance().chain_id.substr(0, 8) === "4018d784" && isMyAccount;

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
                onClick={this._onNavigate.bind(this, "/dashboard")}
            >
                <img style={{margin: 0, height: 40}} src={logo} />
            </a>
        );


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

        const searchResult = this.state.searchResult.map((r,i)=>{
          return <li key={r.text + "_" + i}>
              <Link to={r.url} target="_blank">
                  <div>{r.text}</div>
                  <div>{r.type}</div>
              </Link>
          </li>
        });

        return (
            <div className="header-container dark" style={{minHeight:"59px"}}>
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
                            <a style={{flexFlow: "row"}} className={cnames(active.indexOf("blocks") !== -1 ? null : "column-hide-xs", {active: active.indexOf("blocks") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/blocks")}>
                              <Translate className="column-hide-small" component="span" content="explorer.blocks.title" />
                            </a>
                          </li>

                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("assets") !== -1 ? null : "column-hide-xs", {active: active.indexOf("assets") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/assets")}>
                                    <Translate className="column-hide-small" component="span" content="explorer.assets.title" />
                                </a>
                            </li>
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("accounts") !== -1 ? null : "column-hide-xs", {active: active.indexOf("accounts") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/accounts")}>
                                    <Translate className="column-hide-small" component="span" content="explorer.accounts.title" />
                                </a>
                            </li>
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("witnesses") !== -1 ? null : "column-hide-xs", {active: active.indexOf("witnesses") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/witnesses")}>
                                    <Translate className="column-hide-small" component="span" content="explorer.witnesses.title" />
                                </a>
                            </li>
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("committee-members") !== -1 ? null : "column-hide-xs", {active: active.indexOf("committee-members") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/committee-members")}>
                                    <Translate className="column-hide-small" component="span" content="explorer.committee_members.title" />
                                </a>
                            </li>
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames(active.indexOf("markets") !== -1 ? null : "column-hide-xs", {active: active.indexOf("markets") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/markets")}>
                                    <Translate className="column-hide-small" component="span" content="markets.title" />
                                </a>
                            </li>
                          <li>
                            <a style={{flexFlow: "row"}} className={cnames(active.indexOf("fees") !== -1 ? null : "column-hide-xs", {active: active.indexOf("fees") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/fees")}>
                              <Translate className="column-hide-small" component="span" content="fees.title" />
                            </a>
                          </li>
                          <li>
                            <a style={{flexFlow: "row"}} className={cnames(active.indexOf("oracles") !== -1 ? null : "column-hide-xs", {active: active.indexOf("oracles") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/oracles")}>
                              <Translate className="column-hide-small" component="span" content="seer.oracle.title" />
                            </a>
                          </li>
                        </ul>
                    </div>
                </div>

                <div className="search">
                  <div className="input-search">
                    {/* onChange={this._onFilter.bind(this, "filterUIA")}*/}
                    <input placeholder={counterpart.translate("explorer.search")} type="text" value={this.state.searchKey}
                           onChange={e=>this.setState({searchKey:e.target.value})}
                           onKeyDown={this._onSearchKeyDown.bind(this)} />
                    <svg className="icon" aria-hidden="true">
                      <use xlinkHref="#icon-sousuo"></use>
                    </svg>
                  </div>
                  {
                    this.state.searchResult && this.state.searchResult.length > 0 &&
                    <div className="search-result">
                      <ul>
                        {searchResult}
                      </ul>
                    </div>
                  }
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

export default connect(HeaderExplorer, {
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
