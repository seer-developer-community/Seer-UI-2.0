import React from "react";
import Immutable from "immutable";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {ChainStore} from "seerjs/es";
import FormattedAsset from "../Utility/FormattedAsset";
import Translate from "react-translate-component";
import TimeAgo from "../Utility/TimeAgo";
import { connect } from "alt-react";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import classNames from "classnames";
import Explorer from "./Explorer";
import utils from "../../lib/common/utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
var Apis =  require("seerjs-ws").Apis;
require("./witnesses.scss");

class WitnessCard extends React.Component {

    static propTypes = {
        witness: ChainTypes.ChainAccount.isRequired
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    _onCardClick(e) {
        e.preventDefault();
        this.context.router.push(`/account/${this.props.witness.get("name")}`);
    }

    render() {
        let witness_data = ChainStore.getWitnessById( this.props.witness.get('id') )
        if ( !witness_data ) return null;
        let total_collateral = witness_data.get( "total_collateral" );
        let collateral_profit = witness_data.get( "collateral_profit" );

        let witness_aslot = witness_data.get('last_aslot');
        let color = {background:"#fff",border:"1px solid #EFEFEF"};
        if( this.props.most_recent - witness_aslot > 100 ) {
           //color = {borderLeft: "1px solid #FCAB53"};
        }
        else {
           //color = {borderLeft: "1px solid #50D2C2"};
        }
        let last_aslot_time = new Date(Date.now() - ((this.props.most_recent - witness_aslot ) * ChainStore.getObject( "2.0.0" ).getIn( ["parameters","block_interval"] )*1000));

        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card" style={color}>
                    <div style={{height:60,lineHeight:"60px",background:"#f2f2f2",fontSize:"20px",color:"#0c0D26",fontWeight:"bold",textAlign:"center"}}>
                      #{this.props.rank}: {this.props.witness.get('name')}
                    </div>
                    <div className="card-content" style={{margin:0}}>
                        <div className="text-center" style={{margin:"30px 0"}}>
                            <AccountImage account={this.props.witness.get('name')} size={{height: 80, width: 80}}/>
                        </div>
                        <table className="table key-value-table">
                            <tbody>
                                <tr style={{height:44}}>
                                    <td><Translate content="explorer.witnesses.total_collateral" style={{marginLeft:20}}/></td>
                                    <td style={{textAlign:"right"}}>
                                      <span style={{marginRight:20}}><FormattedAsset amount={total_collateral} asset="1.3.0" decimalOffset={5} /></span>
                                    </td>
                                </tr>
                                <tr style={{height:44}}>
                                    <td><Translate content="explorer.witnesses.collateral_profit" style={{marginLeft:20}}/></td>
                                    <td style={{textAlign:"right"}}>
                                      <span style={{marginRight:20}}><FormattedAsset amount={collateral_profit} asset="1.3.0" decimalOffset={5} /></span></td>
                                </tr>
                                <tr style={{height:44}}>
                                    <td><Translate content="explorer.blocks.last_block" style={{marginLeft:20}}/></td>
                                    <td style={{textAlign:"right"}}>
                                      <span style={{marginRight:20}}><TimeAgo time={new Date(last_aslot_time)} /></span>
                                    </td>
                                </tr>
                                <tr style={{height:44,border:"none"}}>
                                    <td><Translate content="explorer.witnesses.missed" style={{marginLeft:20}}/></td>
                                    <td style={{textAlign:"right"}}>
                                      <span style={{marginRight:20}}>{witness_data.get('total_missed')}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}
WitnessCard = BindToChainState(WitnessCard, {keep_updating: true});

class WitnessRow extends React.Component {

    static propTypes = {
        witness: ChainTypes.ChainAccount.isRequired
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    _onRowClick(e) {
        e.preventDefault();
        this.context.router.push(`/account/${this.props.witness.get("name")}`);
    }

    // componentWillUnmount() {
    //     ChainStore.unSubFrom("witnesses", ChainStore.getWitnessById( this.props.witness.get("id") ).get("id"));
    // }

    render() {
        let {witness, isCurrent, rank} = this.props;
        let witness_data = ChainStore.getWitnessById( this.props.witness.get('id') );
        if ( !witness_data ) return null;
        let total_collateral = witness_data.get( "total_collateral" );

        let witness_aslot = witness_data.get('last_aslot')
        let color = {};
        if( this.props.most_recent - witness_aslot > 100 ) {
          // color = {borderLeft: "1px solid #FCAB53"};
        }
        else {
           //color = {borderLeft: "1px solid #50D2C2"};
        }
        let last_aslot_time = new Date(Date.now() - ((this.props.most_recent - witness_aslot ) * ChainStore.getObject( "2.0.0" ).getIn( ["parameters","block_interval"] )*1000));

        let currentClass = isCurrent ? "active-witness" : "";

        let missed = witness_data.get('total_missed');
        let missedClass = classNames("txtlabel",
            {"success": missed <= 500 },
            {"info": missed > 500 && missed <= 1250},
            {"warning": missed > 1250 && missed <= 2000},
            {"error": missed >= 200}
        );

        return (
            <tr className={currentClass} onClick={this._onRowClick.bind(this)} >
                <td>{rank}</td>
                <td style={color}>{witness.get("name")}</td>
                <td><TimeAgo time={new Date(last_aslot_time)} /></td>
                <td>{witness_data.get('last_confirmed_block_num')}</td>
                <td>
                    <span className={missedClass}>{missed}</span>
                </td>
                <td><FormattedAsset amount={witness_data.get('total_collateral')} asset="1.3.0" decimalOffset={5} /></td>
                <td><FormattedAsset amount={witness_data.get('collateral_profit')} asset="1.3.0" decimalOffset={5} /></td>
            </tr>
        )
    }
}
WitnessRow = BindToChainState(WitnessRow, {keep_updating: true});

class WitnessList extends React.Component {

    static propTypes = {
        witnesses: ChainTypes.ChainObjectsList.isRequired
    }

    constructor () {
        super();
        this.state = {
          sortBy: 'rank',
          inverseSort: true
        };
    }

    _setSort(field) {
        this.setState({
          sortBy: field,
          inverseSort: field === this.state.sortBy ? !this.state.inverseSort : this.state.inverseSort
        });
      }

    render() {

        let {witnesses, current, cardView, witnessList} = this.props;
        let {sortBy, inverseSort} = this.state;
        let most_recent_aslot = 0;
        let ranks = {};

        witnesses
        .filter(a => {
            if (!a) {
                return false;
            }
            return witnessList.indexOf(a.get("id")) !== -1;
        })
        .sort((a, b) => {
            if (a && b) {
                return parseInt(b.get("total_collateral"), 10) - parseInt(a.get("total_collateral"), 10);
            }
        })
        .forEach( (w, index) => {
            if (w) {
                let s = w.get("last_aslot");
                if( most_recent_aslot < s ) {
                    most_recent_aslot = s;
                }

                ranks[w.get("id")] = index + 1;
            }
        });

        let itemRows = null;
        if (witnesses.length > 0 && witnesses[1]) {
            itemRows = witnesses
                .filter(a => {
                    if (!a) { return false; }
                    let account = ChainStore.getObject(a.get("witness_account"));
                    if (!account) return false;
                    let name = account.get("name");
                    if (!name) return false;
                    return name.indexOf(this.props.filter) !== -1;
                })
                .sort((a, b) => {
                    let a_account = ChainStore.getObject(a.get("witness_account"));
                    let b_account = ChainStore.getObject(b.get("witness_account"));

                    if (!a_account || !b_account) {
                        return 0;
                    }
                    // console.log("a:", a.toJS());

                    switch (sortBy) {
                        case 'name':
                            if (a_account.get("name") > b_account.get("name")) {
                                return inverseSort ? 1 : -1;
                            } else if (a_account.get("name") < b_account.get("name")) {
                                return inverseSort ? -1 : 1;
                            } else {
                                return 0;
                            }
                            break;

                        case "rank":
                            return !inverseSort ? ranks[b.get("id")] - ranks[a.get("id")] : ranks[a.get("id")] - ranks[b.get("id")];
                            break;

                        default:
                            return !inverseSort ? parseInt(b.get(sortBy), 10) - parseInt(a.get(sortBy), 10) : parseInt(a.get(sortBy), 10) - parseInt(b.get(sortBy), 10);
                    }


                })
                .map((a) => {

                    if (!cardView) {
                        return (
                            <WitnessRow key={a.get("id")} rank={ranks[a.get("id")]} isCurrent={current === a.get("id")}  witness={a.get("witness_account")} most_recent={this.props.current_aslot} />
                        );
                    } else {
                        return (
                            <WitnessCard key={a.get("id")} rank={ranks[a.get("id")]} witness={a.get("witness_account")} most_recent={this.props.current_aslot} />
                        );
                    }


                });
        }

        // table view
        if (!cardView) {
            return (
                <table className="table table-hover dashboard-table even-bg">
                    <thead>
                        <tr>
                            <th style={{fontWeight:"bold",background:"#F8F8FA",color:"#0C0D26"}} className="clickable" onClick={this._setSort.bind(this, 'rank')}><Translate content="explorer.witnesses.rank" /></th>
                            <th style={{fontWeight:"bold",background:"#F8F8FA",color:"#0C0D26"}} className="clickable" onClick={this._setSort.bind(this, 'name')}><Translate content="account.votes.name" /></th>
                            <th style={{fontWeight:"bold",background:"#F8F8FA",color:"#0C0D26"}} className="clickable" onClick={this._setSort.bind(this, 'last_aslot')}><Translate content="explorer.blocks.last_block" /></th>
                            <th style={{fontWeight:"bold",background:"#F8F8FA",color:"#0C0D26"}} className="clickable" onClick={this._setSort.bind(this, 'last_confirmed_block_num')}><Translate content="explorer.witnesses.last_confirmed" /></th>
                            <th style={{fontWeight:"bold",background:"#F8F8FA",color:"#0C0D26"}} className="clickable" onClick={this._setSort.bind(this, 'total_missed')}><Translate content="explorer.witnesses.missed" /></th>
                            <th style={{fontWeight:"bold",background:"#F8F8FA",color:"#0C0D26"}} className="clickable" onClick={this._setSort.bind(this, 'total_collateral')}><Translate content="explorer.witnesses.total_collateral" /></th>
                            <th style={{fontWeight:"bold",background:"#F8F8FA",color:"#0C0D26"}} className="clickable" onClick={this._setSort.bind(this, 'collateral_profit')}><Translate content="explorer.witnesses.collateral_profit" /></th>
                        </tr>
                    </thead>
                <tbody>
                    {itemRows}
                </tbody>

            </table>
            )
        }
        else {
            return (
                <div className="grid-block small-up-1 medium-up-2 large-up-3">
                    {itemRows}
                </div>
            );
        }
    }
}
WitnessList = BindToChainState(WitnessList, {keep_updating: true, show_loader: true});

class Witnesses extends React.Component {


    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired,
        dynGlobalObject: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        globalObject: "2.0.0",
        dynGlobalObject: "2.1.0"
    }

    constructor(props) {
        super(props);

        this.state = {
            filterWitness: props.filterWitness || "",
            cardView: props.cardView,
            viewType:0,
            allWitnesses:[]
        };
    }

    componentWillMount() {
        Apis.instance().db_api().exec("lookup_witness_accounts", ["", 1000]).then(r => {
            const arr =  r.map((item, i) => {
                return  item[1]
            })
            this.setState({allWitnesses:arr})
         //   console.log(this.state.allWitnesses)
        });
    }

    _onFilter(e) {
        e.preventDefault();
        this.setState({filterWitness: e.target.value.toLowerCase()});

        SettingsActions.changeViewSetting({
            filterWitness: e.target.value.toLowerCase()
        });
    }

    _toggleView() {
        SettingsActions.changeViewSetting({
            cardView: !this.state.cardView
        });

        this.setState({
            cardView: !this.state.cardView
        });
    }

    _activeView() {
        this.setState({viewType:0});
    }

    _collateralView() {
        this.setState({viewType:1});
    }

    _allView() {
        this.setState({viewType:2});
    }

    render() {
        let { dynGlobalObject, globalObject } = this.props;
        dynGlobalObject = dynGlobalObject.toJS();
        globalObject = globalObject.toJS();

        let current = ChainStore.getObject(dynGlobalObject.current_witness),
            currentAccount = null;
        if (current) {
            currentAccount = ChainStore.getObject(current.get("witness_account"));
        }

        let witlst;
        if(this.state.viewType == 0){
            witlst=(
            <WitnessList
                current_aslot={dynGlobalObject.current_aslot}
                current={current ? current.get("id") : null}
                witnesses={Immutable.List(globalObject.active_witnesses)}
                witnessList={globalObject.active_witnesses}
                filter={this.state.filterWitness}
                cardView={this.state.cardView}
            />
            );
        }else if(this.state.viewType == 1){
            witlst=(
                <WitnessList
                    current_aslot={dynGlobalObject.current_aslot}
                    current={current ? current.get("id") : null}
                    witnesses={Immutable.List(globalObject.active_collateral_witnesses)}
                    witnessList={globalObject.active_collateral_witnesses}
                    filter={this.state.filterWitness}
                    cardView={this.state.cardView}
                />
            );
        }else if(this.state.viewType == 2){
            witlst=(
                <WitnessList
                    current_aslot={dynGlobalObject.current_aslot}
                    current={current ? current.get("id") : null}
                    witnesses={Immutable.List(this.state.allWitnesses)}
                    witnessList={this.state.allWitnesses}
                    filter={this.state.filterWitness}
                    cardView={this.state.cardView}
                />
            );
        };

      let gridValueStyle = {
        fontSize:"18px",
        color:"#0C0D26",
        fontWeight:"bold",
        marginTop:"20px"
      };

      let placeholder = counterpart.translate("markets.input_account_filter").toUpperCase();

        let content =
            <div ref="outerWrapper" className="grid-block vertical">

              <div className="align-center grid-block shrink small-horizontal blocks-row" style={{marginTop:41}}>
                <div className="grid-block text-center small-6 medium-2">
                  <div className="grid-content no-overflow">
                    <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.witnesses.current" /></div>
                    <div style={gridValueStyle}>{currentAccount ? currentAccount.get("name") : null}</div>
                  </div>
                </div>
                <div className="grid-block text-center small-6 medium-2">
                  <div className="grid-content no-overflow">
                    <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.active_witnesses" /></div>
                    <div style={gridValueStyle}>{Object.keys(globalObject.active_witnesses).length}</div>
                  </div>
                </div>
                <div className="grid-block text-center small-6 medium-2">
                  <div className="grid-content no-overflow">
                    <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.witnesses.participation" /></div>
                    <div style={gridValueStyle}>{dynGlobalObject.participation}%</div>
                  </div>
                </div>
                <div className="grid-block text-center small-6 medium-2">
                  <div className="grid-content no-overflow">
                    <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.witnesses.pay" />(SEER)</div>
                    <div style={gridValueStyle}>
                      <FormattedAsset amount={globalObject.parameters.witness_pay_per_block}
                                      asset="1.3.0"
                                      hide_asset={true}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid-block text-center small-6 medium-2">
                  <div className="grid-content no-overflow clear-fix">
                    <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.witnesses.budget" />(SEER)</div>
                    <div className="txtlabel success"  style={gridValueStyle}>
                      <FormattedAsset amount={dynGlobalObject.witness_budget} asset="1.3.0" hide_asset={true} />
                    </div>
                  </div>
                </div>

                <div className="grid-block text-center small-6 medium-2">
                  <div className="grid-content no-overflow clear-fix">
                    <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.witnesses.next_vote" /></div>
                    <div className="txtlabel success" style={gridValueStyle}>
                      <TimeAgo time={new Date(dynGlobalObject.next_maintenance_time + "Z")} />
                    </div>
                  </div>
                </div>
              </div>

              <h1 style={{backgroundColor:"#f2f2f2",height:"18px",marginTop:"40px",marginBottom:0}}>&nbsp;</h1>

             <div style={{padding:"20px"}}>

              <div>
                <div style={{display:"inline-block"}}>
                  <div className="input-search" style={{marginBottom: "1rem",maxWidth: "16rem"}} >
                    <svg className="icon" aria-hidden="true">
                      <use xlinkHref="#icon-sousuo"></use>
                    </svg>
                    <input placeholder={placeholder} type="text" value={this.state.filterWitness} onChange={this._onFilter.bind(this)} />
                  </div>
                </div>

                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="button outline tiny" style={{borderRadius:"15px",marginBottom:12}} onClick={this._activeView.bind(this)}>{<Translate content="explorer.witnesses.active"/>}</span>
                <span className="button outline tiny" style={{borderRadius:"15px",marginBottom:12}} onClick={this._collateralView.bind(this)}>{<Translate content="explorer.witnesses.collateral"/>}</span>
                <span className="button outline tiny" style={{borderRadius:"15px",marginBottom:12}} onClick={this._allView.bind(this)}>{<Translate content="explorer.witnesses.all"/>}</span>

                <span className="flex-align-middle" onClick={this._toggleView.bind(this)} style={{float:"right",color:"#449E7B",fontSize:"15px"}}>
                    <svg className="icon" aria-hidden="true" style={{width:18,height:18}}>
                      <use xlinkHref="#icon-qiapianshitu"></use>
                    </svg>
                    &nbsp;&nbsp;
                  {
                      !this.state.cardView ? <Translate content="explorer.witnesses.card"/> :
                  <Translate content="explorer.witnesses.table"/>
                  }
                  </span>
              </div>
                 <br/>
              {witlst}
             </div>
            </div>
        ;
        return content;//(<Explorer tab="witnesses" content={content}/>);
    }
}
Witnesses = BindToChainState(Witnesses, {keep_updating: true});

class WitnessStoreWrapper extends React.Component {
    render () {
        return <Witnesses {...this.props}/>;
    }
}

WitnessStoreWrapper = connect(WitnessStoreWrapper, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            cardView: SettingsStore.getState().viewSettings.get("cardView"),
            filterWitness: SettingsStore.getState().viewSettings.get("filterWitness")
        };
    }
});

export default WitnessStoreWrapper;
