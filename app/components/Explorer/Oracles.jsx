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
import {Apis} from "seerjs-ws";
import {Link} from "react-router/es";
import AccountStore from "../../stores/AccountStore";

require("./witnesses.scss");

class OracleCard extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        oracle: React.PropTypes.object
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    _onCardClick(e) {
        e.preventDefault();
        //this.context.router.push(`/explorer/houses/${this.props.house.id}`);
    }

    render() {
        return (
            <div className="grid-content" onClick={this._onCardClick.bind(this)} style={{flex: "0 0 50%",maxWidth: "50%",padding: "0 1.6rem 1.6rem 0"}}>
                <div className="card" style={{background:"#fff",borderColor:"#EFEFEF"}}>
                    <br/>
                    <div className="card-content" style={{margin:"1rem 1rem 0 1rem"}}>
                        <table>
                            <tr>
                                <td rowSpan={2} width="96px">
                                  <AccountImage account={this.props.account.get('name')} size={{height: 64, width: 64}}/>
                                </td>
                                <td><span style={{fontSize:"18px",color:"#0c0d26",fontWeight:"bold"}}>{this.props.account.get("name")}</span></td>
                            </tr>
                            <tr>
                              <td><span style={{fontSize:"14px",color:"#666"}}>ID: {this.props.account.get("id")}</span></td>
                            </tr>
                        </table>
                      <br/>
                      <br/>
                        <p style={{background:"#F2F2F2",width:"100%",height:"96px",padding:"20px 15px",fontSize:"14px",color:"#666"}}>
                          {this.props.oracle.description}
                        </p>

                        <table className="table key-value-table">
                            <tbody>
                            <tr>
                                <td><Translate content="seer.oracle.guaranty"/></td>
                                <td style={{textAlign:"right"}}><FormattedAsset amount={this.props.oracle.guaranty} asset={"1.3.0"}/></td>
                            </tr>
                            <tr>
                              <td><Translate content="seer.oracle.locked_guaranty"/></td>
                              <td style={{textAlign:"right"}}><FormattedAsset amount={this.props.oracle.locked_guaranty} asset={"1.3.0"}/></td>
                            </tr>
                            <tr>
                                <td><Translate content="seer.oracle.reputation"/></td>
                                <td style={{textAlign:"right"}}>{this.props.oracle.reputation}</td>
                            </tr>
                            <tr style={{border:"none"}}>
                                <td><Translate content="seer.oracle.volume"/></td>
                                <td style={{textAlign:"right"}}>{this.props.oracle.volume}</td>
                            </tr>
                            {/*<tr>*/}
                                {/*<td><Translate content="seer.oracle.script"/></td>*/}
                                {/*<td style={{textAlign:"right"}}>{this.props.oracle.script.substring(0,32)}</td>*/}
                            {/*</tr>*/}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}
OracleCard = BindToChainState(OracleCard, {keep_updating: true});

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
        let total_votes = witness_data.get( "total_votes" );

        let witness_aslot = witness_data.get('last_aslot')
        let color = {};
        if( this.props.most_recent - witness_aslot > 100 ) {
            color = {borderLeft: "1px solid #FCAB53"};
        }
        else {
            color = {borderLeft: "1px solid #50D2C2"};
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
                <td className={missedClass}>{missed}</td>
                <td><FormattedAsset amount={witness_data.get('total_votes')} asset="1.3.0" decimalOffset={5} /></td>
            </tr>
        )
    }
}
WitnessRow = BindToChainState(WitnessRow, {keep_updating: true});

class OracleList extends React.Component {

    static propTypes = {
        witnesses: ChainTypes.ChainObjectsList.isRequired
    }

    constructor () {
        super();
        this.state = {
            sortBy: 'rank',
            inverseSort: true,
            oracles: []
        };

    }

    componentWillMount() {
        Apis.instance().db_api().exec("lookup_oracle_accounts", [0, 1000]).then((results) => {
            let ids = [];
            results.forEach(r => {
                ids.push(r[1]);
            });

            Apis.instance().db_api().exec("get_oracles", [ids]).then(houses => {
                this.setState({oracles: houses});
            });
        });
    }

    _setSort(field) {
        this.setState({
            sortBy: field,
            inverseSort: field === this.state.sortBy ? !this.state.inverseSort : this.state.inverseSort
        });
    }

    render() {

        let {witnesses, current, cardView, witnessList} = this.props;
        let {sortBy, inverseSort, oracles} = this.state;
        let most_recent_aslot = 0;
        let ranks = {};

        let itemRows = null;
        if (witnesses.length > 0 && witnesses[1]) {
            itemRows = oracles
                .map((a) => {

                    if (0) {
                        return (
                            <WitnessRow key={a.get("id")} rank={ranks[a.get("id")]} isCurrent={current === a.get("id")}  witness={a.get("witness_account")} most_recent={this.props.current_aslot} />
                        );
                    } else {
                        return (
                            <OracleCard key={a.id} oracle={a} account={a.owner}/>
                        );
                    }


                });
        }

        // table view
        if (!cardView) {
            return (
                <table className="table table-hover">
                  <thead>
                  <tr>
                    <th className="clickable" onClick={this._setSort.bind(this, 'rank')}><Translate content="explorer.witnesses.rank" /></th>
                    <th className="clickable" onClick={this._setSort.bind(this, 'name')}><Translate content="account.votes.name" /></th>
                    <th className="clickable" onClick={this._setSort.bind(this, 'last_aslot')}><Translate content="explorer.blocks.last_block" /></th>
                    <th className="clickable" onClick={this._setSort.bind(this, 'last_confirmed_block_num')}><Translate content="explorer.witnesses.last_confirmed" /></th>
                    <th className="clickable" onClick={this._setSort.bind(this, 'total_missed')}><Translate content="explorer.witnesses.missed" /></th>
                    <th className="clickable" onClick={this._setSort.bind(this, 'total_votes')}><Translate content="account.votes.votes" /></th>
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
OracleList = BindToChainState(OracleList, {keep_updating: true, show_loader: true});

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
            cardView: true //props.cardView
        };
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

    render() {
        let { dynGlobalObject, globalObject } = this.props;
        dynGlobalObject = dynGlobalObject.toJS();
        globalObject = globalObject.toJS();

        let current = ChainStore.getObject(dynGlobalObject.current_witness),
            currentAccount = null;
        if (current) {
            currentAccount = ChainStore.getObject(current.get("witness_account"));
        }

        let content =
          <div className="grid-block" style={{backgroundColor:"#F2F2F2",marginTop:60}}>
            <OracleList
              current_aslot={dynGlobalObject.current_aslot}
              current={current ? current.get("id") : null}
              witnesses={Immutable.List(globalObject.active_witnesses)}
              witnessList={globalObject.active_witnesses}
              filter={this.state.filterWitness}
              cardView={this.state.cardView}
            />
          </div>
        ;
        return content;//(<Explorer tab="oracles" content={content}/>);
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
