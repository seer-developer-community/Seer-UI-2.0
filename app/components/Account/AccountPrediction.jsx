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

class AccountsContainer extends React.Component {
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
                <Accounts {...this.props} />
            </AltContainer>
        );
    }
}

class Accounts extends React.Component {

    constructor(props) {
        super();

        this.state = {
            width: null,
            showIgnored: false,
            currentEntry: props.currentEntry,
            myJoinedPredictions:[]
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    componentWillMount() {
      let rpath = this.props.routes[this.props.routes.length - 1].path;
      if(rpath === "history"){
        SettingsActions.changeViewSetting({ accountTab:1 });
      }else if(rpath === "contacts"){
        SettingsActions.changeViewSetting({ accountTab:2 });
      }else{
        SettingsActions.changeViewSetting({ accountTab:0 });
      }

      this._loadData(this.props.account.get("id"));
    }

    componentDidMount() {
        this._setDimensions();

        window.addEventListener("resize", this._setDimensions, {capture: false, passive: true});
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
            nextState.myJoinedPredictions !== this.state.myJoinedPredictions
        );
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setDimensions);
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
    }

    _setDimensions() {
        let width = window.innerWidth;

        if (width !== this.state.width) {
            this.setState({width});
        }
    }

    _onToggleIgnored() {
        this.setState({
            showIgnored: !this.state.showIgnored
        });
    }

    _onSwitchType(type) {
        this.setState({
            currentEntry: type
        });
        SettingsActions.changeViewSetting({
            dashboardEntry: type
        });
    }

    render() {
        let { account ,linkedAccounts, myIgnoredAccounts, accountsReady, passwordAccount } = this.props;
        let {width, showIgnored, featuredMarkets, newAssets, currentEntry} = this.state;

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
              <td style={{lineHeight:"22px"}}><div>{r.room.description}{r.room.description}{r.room.description}{r.room.description}</div></td>
              <td style={{lineHeight:"22px"}}><div>{r.room.option.start} - </div><div>{r.room.option.stop}</div></td>
              <td style={{color:r.room.status==="opening"?"#FB7704":"#666"}}>{r.room.status}</td>
              <td style={{textAlign:"right"}}><FormattedAsset amount={r.paid} asset={r.asset_id} hide_asset={false}/></td>
              <td style={{textAlign:"right",color:r.reward < 0 ?"#E20E26": r.reward === 0 ? "#666" : "#449E7B"}}><FormattedAsset amount={r.reward} asset={r.asset_id} hide_asset={false}/></td>
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
                        <RecentTransactions
                          accountsList={Immutable.fromJS([account.get("id")])}
                          compactView={false}
                          showMore={true}
                          fullHeight={true}
                          limit={15}
                          showFilters={true}
                          dashboard
                        />
                      </Tab>
                    </Tabs>
                </div>
            </div>
        );
    }
}

const DashboardAccountsOnly = (props) => {
    return <AccountsContainer {...props} onlyAccounts />;
};

export default DashboardAccountsOnly;
