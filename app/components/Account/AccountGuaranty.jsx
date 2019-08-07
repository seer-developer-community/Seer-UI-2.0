import React from "react";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import AssetStore from "stores/AssetStore";
import FormattedAsset from "../Utility/FormattedAsset";
import {debounce} from "lodash";
import LoadingIndicator from "../LoadingIndicator";
import { connect } from "alt-react";
import { Map, List } from "immutable";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AccountHouseCreate from "./AccountHouseCreate";
var Apis =  require("seerjs-ws").Apis;

let roomType = ["PVD", "PVP", "Advanced"];

class AccountHouse extends React.Component {

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static defaultProps = {
    symbol: "",
    name: "",
    description: "",
    max_supply: 0,
    precision: 0
  };

  static propTypes = {
    assetsList: ChainTypes.ChainAssetsList,
    symbol: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      create: {
        symbol: "",
        name: "",
        description: "",
        max_supply: 1000000000000000,
        precision: 4
      },
      issue: {
        amount: 0,
        to: "",
        to_id: "",
        asset_id: "",
        symbol: ""
      },
      errors: {
        symbol: null
      },
      isValid: false,
      searchTerm: "",
      house: {
        description: "",
        script: "",
        reputation: 0,
        guaranty: 0,
        volume: 0
      },
      rooms: [],
      current_room: ""
    };
  }

  componentWillMount() {
    Apis.instance().db_api().exec("get_house_by_account", [this.props.account.get("id")]).then((results) => {
      this.setState({house: results,rooms:[]});
      if(results)
        results.rooms.forEach(room => {
          Apis.instance().db_api().exec("get_seer_room", [room, 0, 10]).then(r => {
            this.state.rooms.push(r);
            this.forceUpdate();
          });
        });
    });
  }
  componentWillReceiveProps(np) {
    if (np.account.get("id") !== this.props.account.get("id")) {
      this.setState({house: null,rooms:[]});
      Apis.instance().db_api().exec("get_house_by_account", [np.account.get("id")]).then((results) => {
        this.setState({house: results});
        if(results)
          results.rooms.forEach(room => {
            Apis.instance().db_api().exec("get_seer_room", [room, 0, 10]).then(r => {
              this.state.rooms.push(r);
              this.forceUpdate();
            });
          });
      });
    }
  }

  _updateHouse(){
    this.context.router.push(`/account/${this.props.account_name}/update-house/${this.state.house.id}`);
  }

  render() {
    let {account, account_name, assets, assetsList} = this.props;

    let accountExists = true;
    if (!account) {
      return <LoadingIndicator type="circle"/>;
    } else if (account.notFound) {
      accountExists = false;
    }
    if (!accountExists) {
      return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
    }

    if (assetsList.length) {
      assets = assets.clear();
      assetsList.forEach(a => {
        if (a) assets = assets.set(a.get("id"), a.toJS());
      });
    }


    if(!(this.state.house && this.state.house.id)){
     // this.context.router.replace("/account/"+ account_name +"/create-house");
      return <AccountHouseCreate {...this.props}/>;
    }

    return (
      <div className="grid-content app-tables no-padding" ref="appTables">
        <div className="content-block small-12" style={{paddingTop:"34px"}}>
            <Translate content="account.guaranty.title" component="h5" style={{fontWeight:"bold"}}/>
            <Translate content="account.guaranty.explain" component="p" style={{fontSize:"14px",color:"#999"}}/>

            <table className="table key-value-table" style={{width: "100%"}}>
              <tbody>
              <tr>
                <td width="8%"><Translate content="seer.oracle.description"/></td>
                <td>{this.state.house.description}</td>
              </tr>
              <tr>
                <td><Translate content="seer.oracle.guaranty"/></td>
                <td><FormattedAsset amount={this.state.house.guaranty} asset="1.3.0"/></td>
              </tr>
              <tr>
                <td><Translate content="seer.oracle.reputation"/></td>
                <td>{this.state.house.reputation}</td>
              </tr>
              <tr>
                <td><Translate content="seer.oracle.volume"/></td>
                <td>{this.state.house.volume}</td>
              </tr>
              <tr>
                <td>
                  <span><Translate content="seer.oracle.script"/></span>
                </td>
                <td>
                  <p className="wrap">
                  {this.state.house.script}
                  </p>
                  </td>
              </tr>
              </tbody>
            </table>
            <br/>

            <button onClick={this._updateHouse.bind(this)} className="button primary" style={{marginTop:"48px"}}>
              <Translate content="account.guaranty.update"/>
            </button>
        </div>
      </div>
    );
  }
}

AccountHouse = BindToChainState(AccountHouse);

export default connect(AccountHouse, {
  listenTo() {
    return [AssetStore];
  },
  getProps(props) {
    let assets = Map(), assetsList = List();
    if (props.account.get("assets", []).size) {
      props.account.get("assets", []).forEach(id => {
        assetsList = assetsList.push(id);
      });
    } else {
      assets = AssetStore.getState().assets;
    }
    return {assets, assetsList};
  }
});