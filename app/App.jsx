import {ChainStore} from "seerjs/es";
import React from "react";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import NotificationStore from "stores/NotificationStore";
import intlData from "./components/Utility/intlData";
import alt from "alt-instance";
import { connect, supplyFluxContext } from "alt-react";
import {IntlProvider} from "react-intl";
import SyncError from "./components/SyncError";
import LoadingIndicator from "./components/LoadingIndicator";
import BrowserNotifications from "./components/BrowserNotifications/BrowserNotificationsContainer";
import Header from "components/Layout/HeaderNav";
import HeaderExplorer from "components/Layout/HeaderExplorer";
import BrowserNotificationActions from "actions/BrowserNotificationActions"
// import MobileMenu from "components/Layout/MobileMenu";
import ReactTooltip from "react-tooltip";
import NotificationSystem from "react-notification-system";
import TransactionConfirm from "./components/Blockchain/TransactionConfirm";
import WalletUnlockModal from "./components/Wallet/WalletUnlockModal";
import BrowserSupportModal from "./components/Modal/BrowserSupportModal";
import Footer from "./components/Layout/Footer";
import Deprecate from "./Deprecate";
import  _ from "lodash";
import IntlActions from "actions/IntlActions";
import IntlStore from "stores/IntlStore";
import WebApi from "./api/WebApi";
import counterpart from "counterpart";
import utils from "common/utils";
import {websiteAPIs} from "api/apiConfig";

var moment = require('moment');

// import Incognito from "./components/Layout/Incognito";
// import { isIncognito } from "feature_detect";

class App extends React.Component {

    constructor() {
        super();

        // Check for mobile device to disable chat
        const user_agent = navigator.userAgent.toLowerCase();
        let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        let syncFail = ChainStore.subError && (ChainStore.subError.message === "ChainStore sync error, please check your system clock") ? true : false;
        this.state = {
            loading: false,
            synced: this._syncStatus(),
            syncFail,
            theme: SettingsStore.getState().settings.get("themes"),
            isMobile: !!(/android|ipad|ios|iphone|windows phone/i.test(user_agent) || isSafari),
            incognito: false,
            incognitoWarningDismissed: false,
            height: window && window.innerHeight,
            notifiedList:[],
            seerAsset:null
        };

        this._rebuildTooltips = this._rebuildTooltips.bind(this);
        this._onSettingsChange = this._onSettingsChange.bind(this);
        this._chainStoreSub = this._chainStoreSub.bind(this);
        this._syncStatus = this._syncStatus.bind(this);
        this._roomNotices = this._roomNotices.bind(this);
        this._getWindowHeight = this._getWindowHeight.bind(this);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._getWindowHeight);
        NotificationStore.unlisten(this._onNotificationChange);
        SettingsStore.unlisten(this._onSettingsChange);
        ChainStore.unsubscribe(this._chainStoreSub);
        clearInterval(this.syncCheckInterval);
        clearInterval(this.checkRoomNoticeInterval);
    }

    // componentWillMount() {
    //     this._initData();
    // }

    // _initData(){
    //     fetch(websiteAPIs.BASE + websiteAPIs.HOUSES_INDEX_DATA, {
    //         method:"post",
    //         mode:"cors"
    //     }).then((response) => response.json())
    //       .then(r=>{
    //         if(json && json.result && json.result.length > 0){
    //
    //         }
    //     });
    // }

    _roomNotices(){
        console.log("check room notice！");

        let asset = ChainStore.getAsset("1.3.0")
        let account_name = AccountStore.getState().currentAccount;
        let isMyAccount = AccountStore.isMyAccount(ChainStore.getAccount(account_name));
        if(!isMyAccount) return;

        WebApi.getAllSeerRoom({statusFilter:["inputing"]}).then(rooms=>{
            let awardsGt = SettingsStore.getState().settings.get("room_notice_awards_gt",-1);
            let endTimeLt = SettingsStore.getState().settings.get("room_notice_end_time_lt",-1);
            let awardsGtEnable = SettingsStore.getState().settings.get("room_notice_awards_gt_enable",false);
            let endTimeLtEnable = SettingsStore.getState().settings.get("room_notice_end_time_lt_enable",false);

            if((awardsGtEnable && awardsGt >= 0) || (endTimeLtEnable && endTimeLt > 0)){
                rooms.every(r=>{

                    let roomEndTime = moment.utc(r.option.stop).local().add(r.option.input_duration_secs, 's').valueOf();

                    if(endTimeLtEnable){
                        let timeDiff = roomEndTime - new Date().getTime();
                        if(timeDiff > 0 && timeDiff <= endTimeLt * 60 * 1000 && this.state.notifiedList.indexOf(r.id) === -1) {
                          this.state.notifiedList.push(r.id);
                          BrowserNotificationActions.addNotification({
                            title: counterpart.translate("browser_notification_messages.room_end_time_lt_title"),
                            body:counterpart.translate("browser_notification_messages.room_end_time_lt_body", {
                              room: r.id,
                              min:endTimeLt
                            }),
                            onNotifyClick:()=>{
                              window.open(`/account/${account_name}/oracle?input=1&room=${r.id}`);
                            }
                          });
                          return false;
                        }
                    }

                    let amount = utils.get_asset_amount(r.option.reward_per_oracle,asset);

                    if(awardsGtEnable && amount >= awardsGt && this.state.notifiedList.indexOf(r.id) === -1){
                      this.state.notifiedList.push(r.id);
                      BrowserNotificationActions.addNotification({
                        title: counterpart.translate("browser_notification_messages.room_awards_gt_title"),
                        body:counterpart.translate("browser_notification_messages.room_awards_gt_body", {
                          room: r.id,
                          amount:utils.get_asset_amount(r.option.reward_per_oracle,asset),
                          awards:awardsGt
                        }),
                        onNotifyClick:()=>{
                            window.open(`/account/${account_name}/oracle?input=1&room=${r.id}`);
                        }
                      });
                      return false;
                    }

                    return true;
                });
            }
        });
    }

    _syncStatus(setState = false) {
        let synced = true;
        let dynGlobalObject = ChainStore.getObject("2.1.0");
        if (dynGlobalObject) {
            let block_time = dynGlobalObject.get("time");
            if (!/Z$/.test(block_time)) {
                block_time += "Z";
            }

            let bt = (new Date(block_time).getTime() + ChainStore.getEstimatedChainTimeOffset()) / 1000;
            let now = new Date().getTime() / 1000;
            synced = Math.abs(now - bt) < 5;
        }
        if (setState && synced !== this.state.synced) {
            this.setState({synced});
        }
        return synced;
    }

    _setListeners() {
        try {
            window.addEventListener("resize", this._getWindowHeight, {capture: false, passive: true});
            NotificationStore.listen(this._onNotificationChange.bind(this));
            SettingsStore.listen(this._onSettingsChange);
            ChainStore.subscribe(this._chainStoreSub);
            AccountStore.tryToSetCurrentAccount();
        } catch(e) {
            console.error("e:", e);
        }
    }

    componentDidMount() {
        this._setListeners();
        this.syncCheckInterval = setInterval(this._syncStatus, 5000);
        this.checkRoomNoticeInterval = setInterval(this._roomNotices, 1000 * 60);
        const user_agent = navigator.userAgent.toLowerCase();
        if (!(window.electron || user_agent.indexOf("firefox") > -1 || user_agent.indexOf("chrome") > -1 || user_agent.indexOf("edge") > -1)) {
            this.refs.browser_modal.show();
        }

        this.props.router.listen(this._rebuildTooltips);

        this._rebuildTooltips();
    }

    _onIgnoreIncognitoWarning(){
        this.setState({incognitoWarningDismissed: true});
    }

    _rebuildTooltips() {
        ReactTooltip.hide();

        setTimeout(() => {
            if (this.refs.tooltip) {
                this.refs.tooltip.globalRebuild();
            }
        }, 1500);
    }

    _chainStoreSub() {
        let synced = this._syncStatus();
        if (synced !== this.state.synced) {
            this.setState({synced});
        }
        if (ChainStore.subscribed !== this.state.synced || ChainStore.subError) {
            let syncFail = ChainStore.subError && (ChainStore.subError.message === "ChainStore sync error, please check your system clock") ? true : false;
            this.setState({
                syncFail
            });
        }
    }

    /** Usage: NotificationActions.[success,error,warning,info] */
    _onNotificationChange() {
        let notification = NotificationStore.getState().notification;
        if (notification.autoDismiss === void 0) {
            notification.autoDismiss = 10;
        }
        if (this.refs.notificationSystem) this.refs.notificationSystem.addNotification(notification);
    }

    _onSettingsChange() {
        let {settings, viewSettings} = SettingsStore.getState();
        if (settings.get("themes") !== this.state.theme) {
            this.setState({
                theme: settings.get("themes")
            });
        }
    }

    _getWindowHeight() {
        this.setState({height: window && window.innerHeight});
    }

    // /** Non-static, used by passing notificationSystem via react Component refs */
    // _addNotification(params) {
    //     console.log("add notification:", this.refs, params);
    //     this.refs.notificationSystem.addNotification(params);
    // }

    render() {
        let {isMobile, theme } = this.state;

        let content = null;

        let showFooter = 1;
        // if(incognito && !incognitoWarningDismissed){
        //     content = (
        //         <Incognito onClickIgnore={this._onIgnoreIncognitoWarning.bind(this)}/>
        //     );
        // } else
        if (this.state.syncFail) {
            content = (
                <SyncError />
            );
        } else if (this.state.loading) {
            content = <div className="grid-frame vertical">
                <LoadingIndicator loadingText={"Connecting to APIs and starting app"}/>
            </div>;
        } else if (this.props.location.pathname === "/init-error") {
            content = <div className="grid-frame vertical">{this.props.children}</div>;
        } else if (__DEPRECATED__) {
            content = <Deprecate {...this.props} />;
        } else {
            content = (
                <div className="grid-frame vertical">
                  {
                    _.startsWith(this.props.location.pathname,"/explorer") ?
                      <HeaderExplorer  height={this.state.height}/>
                      :
                      <Header height={this.state.height}/>
                  }

                    <div className="grid-block">
                        <div className="grid-block vertical">
                            {this.props.children}
                        </div>

                    </div>
                    {showFooter ? <Footer synced={this.state.synced}/> : null}
                    <ReactTooltip ref="tooltip" place="top" type={theme === "lightTheme" ? "dark" : "light"} effect="solid"/>
                </div>
            );
        }

        return (
            <div style={{backgroundColor: !this.state.theme ? "#2a2a2a" : null}} className={this.state.theme}>
                <div id="content-wrapper">
                    {content}
                    <NotificationSystem
                        ref="notificationSystem"
                        allowHTML={true}
                        style={{
                            Containers: {
                                DefaultStyle: {
                                    width: "425px"
                                }
                            }
                        }}
                    />
                    <TransactionConfirm/>
                    <BrowserNotifications/>
                    <WalletUnlockModal/>
                    <BrowserSupportModal ref="browser_modal"/>
                </div>
            </div>
        );

    }
}

class RootIntl extends React.Component {
    componentWillMount() {
        IntlActions.switchLocale(this.props.locale);
    }

    render() {
        return (
            <IntlProvider
                locale={this.props.locale}
                formats={intlData.formats}
                initialNow={Date.now()}
            >
                <App {...this.props}/>
            </IntlProvider>
        );
    }
}

RootIntl = connect(RootIntl, {
    listenTo() {
        return [IntlStore];
    },
    getProps() {
        return {
            locale: IntlStore.getState().currentLocale
        };
    }
});

class Root extends React.Component {
    static childContextTypes = {
        router: React.PropTypes.object,
        location: React.PropTypes.object
    }

    componentWillMount(){
        if(!IntlStore.getState().settingLocale){
          IntlActions.switchLocale("zh")
        }
    }

    componentDidMount(){
        //Detect OS for platform specific fixes
        if(navigator.platform.indexOf('Win') > -1){
            var main = document.getElementById('content');
            var windowsClass = 'windows';
            if(main.className.indexOf('windows') === -1){
                main.className = main.className + (main.className.length ? ' ' : '') + windowsClass;
            }
        }
    }

    getChildContext() {
        return {
            router: this.props.router,
            location: this.props.location
        };
    }

    render() {
        return <RootIntl {...this.props} />;
    }
}

export default supplyFluxContext(alt)(Root);
