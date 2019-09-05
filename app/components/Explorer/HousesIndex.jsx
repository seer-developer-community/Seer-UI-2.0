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
import {Apis} from "seerjs-ws";
import {websiteAPIs} from "api/apiConfig";
import {Link} from "react-router/es";
import AccountStore from "../../stores/AccountStore";
import Icon from "../Icon/Icon";
import IntlStore from "../../stores/IntlStore";
import Slider from "react-slick";
import RoomCard from "../Account/RoomCard";

require("./housesIndex.scss");

class HouseCard extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        house: React.PropTypes.object
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    _onCardClick(e) {
        e.preventDefault();
        this.context.router.push(`/houses/${this.props.house.id}`);
    }

    render() {
        let house=this.props.house;
       // let script=house.script?house.script.indexOf("{")!=-1?JSON.parse(house.script):{}:{}
        //let iconUrl = house.script.indexOf("{") != -1 ? JSON.parse(house.script).iconUrl : house.script;
        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card">
                    <h3 className="text-center">{this.props.account.get("name")}</h3>
                    <div className="card-content">
                        <br/>
                        <table className="table key-value-table table-column-fixed">
                            <tbody>
                                <tr>
                                    <td width={80}><Translate content="seer.oracle.description"/></td>
                                    <td className="text-ellipsis">{house.description}</td>
                                </tr>
                                <tr>
                                    <td><Translate content="seer.oracle.guaranty"/></td>
                                    <td><FormattedAsset amount={house.guaranty} asset={"1.3.0"}/></td>
                                </tr>
                                <tr>
                                    <td><Translate content="seer.oracle.reputation"/></td>
                                    <td>{house.reputation}</td>
                                </tr>
                                <tr>
                                    <td><Translate content="seer.oracle.volume"/></td>
                                    <td>{house.volume}</td>
                                </tr>
                                <tr>
                                    <td><Translate content="seer.oracle.script"/></td>
                                    <td className="text-ellipsis">{this.props.house.script.substring(0,32)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}
HouseCard = BindToChainState(HouseCard, {keep_updating: true});

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

class HouseList extends React.Component {

    static propTypes = {
        witnesses: ChainTypes.ChainObjectsList.isRequired,
        filterLabel:React.PropTypes.string
    }

    constructor () {
        super();
        this.state = {
          sortBy: 'rank',
          inverseSort: true,
            houses: []
        };

    }

    componentWillMount() {
        Apis.instance().db_api().exec("lookup_house_accounts", [0, 1000]).then((results) => {
            let ids = [];
            results.forEach(r => {
                ids.push(r[1]);
            });

            Apis.instance().db_api().exec("get_houses", [ids]).then(houses => {
                this.setState({houses: houses});
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
        let {sortBy, inverseSort, houses} = this.state;
        let most_recent_aslot = 0;
        let ranks = {};

        let itemRows = [];
        if (witnesses.length > 0 && witnesses[1]) {
            itemRows = houses
                .map((a) => {
                  return a.rooms.map(rm=>{
                      return <RoomCard room={rm} key={rm} filterLabel={this.props.filterLabel}/>
                  });
                });
        }

        let rows = [];
        for(let i = 0;i < itemRows.length; i++){
            rows.push(...itemRows[i])
        }

        return (
          <div>
            {rows}
          </div>
        );
    }
}
HouseList = BindToChainState(HouseList, {keep_updating: true, show_loader: true});

class TitlePanel extends React.Component {

  static propTypes = {
    title: React.PropTypes.string
  }

  render(){
    return (
      <div className="title-panel">
        <div className="title"><Translate content={this.props.title}/></div>
        {this.props.children}
      </div>
    );
  }
}

class RankList extends React.Component {

  static propTypes = {
    isVolume:React.PropTypes.bool
  }

  render(){
    return (
      <table className="rank-table">
        <thead>
        <tr>
          <th><Translate content="seer.house.rank"/></th>
          <th><Translate content="seer.house.account"/></th>
          <th><Translate content="seer.house.reputation"/></th>
          <th>
          {
            this.props.isVolume ? <Translate content="seer.house.volume"/>
              :
              <Translate content="seer.house.reward"/>
          }
          </th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        </tbody>
      </table>
    );
  }
}

class Houses extends React.Component {

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
          cardView: true, //props.cardView
          houseLabels: [],
          currentLabel:null,
          images:[],
          roomList:[]
        }
    }

    _getHouseLabels(){
      return fetch(websiteAPIs.BASE + websiteAPIs.HOUSES_INDEX_DATA, {
        method:"post",
        mode:"cors"
      }).then((response) => response.json()
        .then( json => {
          let object = {
            labelArrays:[],
            roomList:[]
          };
          if(json && json.result && json.result.length > 0){
            if(IntlStore.getState().currentLocale === "zh"){
              let labels = json.result[0].indexlabels;
              labels = labels.replace("，",",");
              labels = labels.split("],").join("-*-");
              labels = labels.split(",[").join("-*-");
              labels = labels.replace(new RegExp("\\[|\\]","gm"),"");
              labels = labels.replace(new RegExp(",","gm"),"/");
              object.labelArrays = labels.split("-*-");
            }else{
              let labels = json.result[0].indexlabelsen;
              object.labelArrays = labels.split(",");
            }
            object.roomList = json.result[0].roomoidlist.split(",");
          }
          return object;
        })
      );
    }

    _getImages(){
      return fetch(websiteAPIs.BASE + websiteAPIs.HOUSES_INDEX_IMAGE, {
        method:"post",
        mode:"cors"
      }).then((response) => response.json()
        .then( json => {
          let images = [];
          if(json && json.result && json.result.length > 0){
            images = json.result
          }
          return images;
        })
      );
    }

    _initData(){
      Promise.all([this._getHouseLabels.bind(this)(),this._getImages.bind(this)()])
        .then(([houseObj, images]) => {
          this.setState({
            houseLabels:houseObj.labelArrays,
           // roomList:houseObj.roomList,
            roomList:["1.15.10","1.15.1642","1.15.1628"],

            images
          });
        });
    }

    componentDidMount(){
      this._initData.bind(this)();
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

    _onHouseLabelClick(entry) {
        this.setState({
          currentLabel:entry
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

        const settings = {
          dots: true,
          infinite: true,
          speed: 500,
          arrows:false,
          autoplay: true,
          autoplaySpeed: 5000
        };

        return (
          <div className="container" style={{width:"100%",height:"100%"}}>
            <div className="main" style={{width:"100%",height:"100%"}}>
              <div className="menu-content" style={{width:221,height:"100%"}}>
                <div className="side-menu">
                  <ul>
                    {/*index === activeSetting ? "active" : ""*/}
                    {/*<li className={""} onClick={this._redirectToEntry.bind(this, entry)} key={entry.name}>*/}
                    {
                      this.state.houseLabels.map((item,index)=>{
                        let className = this.state.currentLabel === item ? "active" : "";
                        return (
                          <li className={className} key={index} onClick={this._onHouseLabelClick.bind(this, item)} >
                            <span>{item}</span>
                          </li>
                        );
                      })
                    }
                  </ul>
                </div>
              </div>
              <div className="middle-content" style={{flex:1}}>
                <div className="notice flex-align-middle">
                    <div className="icon-container">
                      <i className="iconfont icon-gonggao1"></i>
                    </div>
                    <div>
                      else 参与 预测市场1236 ，预测选项1“小于7000美元”
                    </div>
                </div>
                <div className="houses-category">
                  <ul>
                    <li className="house-category">PVP</li>
                    <li className="house-category">PVD</li>
                    <li className="house-category">ADV</li>
                    <li className="house-sort asc">
                      参与总量&nbsp;
                      <Icon size="14px" name="sort"/>
                    </li>
                    <li className="house-sort">
                      参与人数&nbsp;
                      <Icon size="14px" name="sort"/>
                    </li>
                    <li className="house-sort">
                      结束时间&nbsp;
                      <Icon size="14px" name="sort"/>
                    </li>
                    <li className="house-sort">
                      创建者权重&nbsp;
                      <Icon size="14px" name="sort"/>
                    </li>
                  </ul>
                </div>
                <div className="image-slider">
                  <Slider {...settings}>
                    {
                      this.state.images.map((item,index)=>{
                        return (
                          <div key={index}>
                            <Link to={"explorer/rooms/" + item[1]} style={{background:"url(" + item[0] + ")"}}/>
                          </div>
                        );
                      })
                    }
                  </Slider>
                </div>
                <div style={{marginTop:"26px"}}>
                  {
                    this.state.roomList && this.state.roomList.map((room,index)=>{
                        return (
                          <RoomCard room={room} key={index} filterLabel={this.state.currentLabel}/>
                        );
                    })
                  }
                  <HouseList
                    current_aslot={dynGlobalObject.current_aslot}
                    current={current ? current.get("id") : null}
                    witnesses={Immutable.List(globalObject.active_witnesses)}
                    witnessList={globalObject.active_witnesses}
                    filter={this.state.filterWitness}
                    cardView={this.state.cardView}
                    filterLabel={this.state.currentLabel}
                  />
                </div>
              </div>
              <div style={{width:297,marginRight:20,marginTop:20}}>
                  <TitlePanel title="seer.house.my_oracle">
                    <div style={{height:900}}>&nbsp;</div>
                  </TitlePanel>
                  <TitlePanel title="seer.house.creator_rank">
                    <RankList isVolume={false}/>
                  </TitlePanel>
                  <TitlePanel title="seer.house.creator_rank">
                    <RankList isVolume={true}/>
                  </TitlePanel>
              </div>
            </div>
          </div>
        );
    }
}
Houses = BindToChainState(Houses, {keep_updating: true});

class HousesStoreWrapper extends React.Component {
    render () {
        return <Houses {...this.props}/>;
    }
}

HousesStoreWrapper = connect(HousesStoreWrapper, {
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

export default HousesStoreWrapper;
