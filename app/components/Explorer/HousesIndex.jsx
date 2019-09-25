import React from "react";
import Immutable from "immutable";
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
import Icon from "../Icon/Icon";
import IntlStore from "../../stores/IntlStore";
import Slider from "react-slick";
import RoomCard from "../Account/RoomCard";
import MyRoomList from "../Account/MyRoomList";
import Operation from "../Blockchain/Operation";
import _ from "lodash";
import WebApi from "api/WebApi"


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
        this.context.router.push(`/prediction/${this.props.house.id}`);
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
        filterLabel:React.PropTypes.string,
        filterRoomType:React.PropTypes.number,
        sortBy:React.PropTypes.number,
        sortType:React.PropTypes.string,
        onRoomOptionCheck:React.PropTypes.func,
        enableHousesWhiteList:React.PropTypes.bool,
        housesWhiteList:React.PropTypes.array,
        excludedHouses:React.PropTypes.array,
        excludedRooms:React.PropTypes.array,
        recommendRooms:React.PropTypes.array
    }

    constructor () {
        super();
        this.state = {
          sortBy: 'rank',
          inverseSort: true,
          rooms:[]
        };
    }

    componentWillMount() {

    }

    componentWillReceiveProps(nextProps) {
      // if(!_.isEmpty(_.differenceWith(nextProps.houses, this.props.houses, _.isEqual))) {
      //   this._loadRooms.bind(this)(nextProps.houses);
      // }
      if(nextProps.recommendRooms !== this.props.recommendRooms ||
        nextProps.excludedRooms !== this.props.excludedRooms ||
        nextProps.excludedHouses !== this.props.excludedHouses ||
        nextProps.housesWhiteList !== this.props.housesWhiteList ||
        nextProps.enableHousesWhiteList !== this.props.enableHousesWhiteList){

        this._loadRooms({
          onlyLoadWhiteListHouses:nextProps.enableHousesWhiteList,
          housesWhiteList:nextProps.housesWhiteList,
          excludedHouses:nextProps.excludedHouses,
          excludedRooms:nextProps.excludedRooms,
          extraRooms:nextProps.recommendRooms
        });
      }
    }

    shouldComponentUpdate(newProps, newState) {
      if(!_.isEmpty(_.differenceWith(newState.rooms, this.state.rooms, _.isEqual))) {
        return true;
      }
      if(newProps.filterLabel !== this.props.filterLabel){
        return true;
      }
      if(newProps.filterRoomType !== this.props.filterRoomType){
        return true;
      }
      if(newProps.sortBy !== this.props.sortBy){
        return true;
      }
      if(newProps.sortType !== this.props.sortType){
        return true;
      }

      return false;
    }

    _loadRooms(options){
        WebApi.getAllSeerRoom(options).then(rooms=>{
          let roomIds = rooms.map(r=>r.id);
          WebApi.getSeersRoomRecords(roomIds,1).then(records=>{
            rooms.map(r=>{
              r.last_record_time = _.has(records,r.id) ? new Date(records[r.id][0].when).getTime(): 0;
            });

            this.setState({
              rooms: this._groupRooms(rooms)
            });
          });
        });
    }

    _groupRooms(rooms){
      let newRooms = [];
      let groupIdsIndex = {};
      rooms.map((r,i)=>{
          let prefix = "(@#-",suffix = "-#@)";
          let start = r.description.indexOf(prefix);
          let end = r.description.indexOf(suffix);
          if(start !== -1 && end !== -1){
              let head = r.description.match(new RegExp("(?<=\\(@#-)\\S+(?=-#@\\))", "g"))[0];
              let groupId = head.match(new RegExp("[^\\(\\)]+(?=\\))","g"))[0];
              //let title = head.replace("("+groupId+")","").trim();
              if(_.has(groupIdsIndex,"g-" + groupId)){
                rooms[groupIdsIndex["g-" + groupId]].subRooms.push(r);
              }else{
                groupIdsIndex["g-" + groupId] = i;
                r.subRooms = [];
                newRooms.push(r);
              }
          }else{
            newRooms.push(r);
          }
      });
      return newRooms;
    }

    _setSort(field) {
        this.setState({
          sortBy: field,
          inverseSort: field === this.state.sortBy ? !this.state.inverseSort : this.state.inverseSort
        });
    }

    _onRoomOptionCheck(room,idx){
        if(this.props.onRoomOptionCheck){
            this.props.onRoomOptionCheck(room,idx);
        }
    }

    render() {
        let {witnesses, current, cardView, witnessList,houses} = this.props;

        let roomCards = [];

        if (witnesses.length > 0 && witnesses[1]) {
          let rooms = _.clone(this.state.rooms);

          let recommendRooms = [];
          let sortRooms = [];
          for(let i = 0;i < rooms.length; i++){
            if(this.props.recommendRooms.indexOf(rooms[i].id) !== -1){
              recommendRooms.push(rooms[i]);
            }else{
              sortRooms.push(rooms[i]);
            }
          }

          if(this.props.filterRoomType !== null && this.props.filterRoomType >= 0) {
            sortRooms = _.filter(sortRooms, { 'room_type': this.props.filterRoomType });
          }



          //sort
          if(this.props.sortBy !== null){
            let props = this.props;
            sortRooms = _.sortBy(sortRooms, [function(o) {
              if(props.sortBy === 1) {
                return o.running_option.total_shares;
              }else if(props.sortBy === 2) {
                return o.running_option.total_player_count;
              } else if(props.sortBy === 3) {
                return o.option.stop;
              } else if(props.sortBy === 4) {
                return o.option.result_owner_percent;
              }else{
                //最新参与
                return o.last_record_time;
              }
            }]);

            if(this.props.sortType === "desc"){
              sortRooms = sortRooms.reverse();
            }
          }

          rooms = [...recommendRooms,...sortRooms];

          roomCards = rooms.map((r, index) => {
            let match = false;
            if (this.props.filterLabel) {
              for (let i = 0; i < r.label.length; i++) {
                if (this.props.filterLabel.indexOf(r.label[i]) > -1) {
                  match = true;
                  break;
                }
              }

              return match ? <RoomCard room={r} key={r.id} recommend={this.props.recommendRooms.indexOf(r.id) !== -1} onOptionCheck={(idx,currRoom)=>this._onRoomOptionCheck(currRoom,idx)}/> : null;
            } else {
              return <RoomCard room={r} key={r.id} recommend={this.props.recommendRooms.indexOf(r.id) !== -1} onOptionCheck={(idx,currRoom)=>this._onRoomOptionCheck(currRoom,idx)}/>;
            }
          });
        }

        return (
          <div>
            {roomCards}
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

class RankRow extends React.Component {

  static propTypes = {
    rank:React.PropTypes.number,
    account:ChainTypes.ChainAccount.isRequired,
    data:React.PropTypes.object,
    isHouse:React.PropTypes.bool
  }

  render(){
    return (
      <tr>
        <td><div>{this.props.rank}</div></td>
        <td><div>{this.props.account.get("name")}</div></td>
        <td><div>{this.props.data.reputation}</div></td>
        <td>
          {
            this.props.isHouse ?
              <FormattedAsset amount={this.props.data.collected_fees} asset={"1.3.0"} hide_asset={true}/>
              :
              <div>
                {this.props.data.volume}
              </div>
          }
        </td>
      </tr>
    );
  }
}

RankRow = BindToChainState(RankRow);

class RankList extends React.Component {

  static propTypes = {
    houses:React.PropTypes.array,
    oracles:React.PropTypes.array
  }

  render(){
    let {houses,oracles} = this.props;
    let isHouse = !!houses;
    let sortedData = null;
    if(isHouse){
      sortedData =_.sortBy(houses,"collected_fees").reverse();
    }else{
      sortedData =_.sortBy(oracles,"volume").reverse();
    }

    if(sortedData.length > 10){
      sortedData = sortedData.slice(0,10);
    }

    return (
      <table className="rank-table">
        <thead>
        <tr>
          <th><Translate content="seer.house.rank"/></th>
          <th width="100px"><Translate content="seer.house.account"/></th>
          <th><Translate content="seer.house.reputation"/></th>
          <th>
          {
            isHouse ? <Translate content="seer.house.reward"/>
              :
              <Translate content="seer.house.volume"/>
          }
          </th>
        </tr>
        </thead>
        <tbody>
        {
          sortedData.map((h,i)=> {
              return (
                <RankRow rank={i+1} account={h.owner} data={h} isHouse={isHouse} key={i}/>
              )
            })
        }
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
          currentLabel: null,
          images: [],
          roomList: [],
          houses: [],
          oracles: [],
          filterRoomType:null,
          sortBy:0,
          sortType:"desc",
          myRooms:[],
          noticeList:[],
          enableWhiteList:false,
          whiteList:[],
          excludedHouses:[],
          excludedRooms:[]
        }
    }

    componentWillMount() {
      Apis.instance().db_api().exec("lookup_house_accounts", ["", 1000]).then((results) => {
        let ids = results.map(r => r[1]);

        Apis.instance().db_api().exec("get_houses", [ids]).then(houses => {
          this.setState({houses: houses});
        });
      });

      Apis.instance().db_api().exec("lookup_oracle_accounts", [0, 1000]).then((results) => {
        let ids = results.map(r => r[1]);

        Apis.instance().db_api().exec("get_oracles", [ids]).then(oracles => {
          this.setState({oracles: oracles});
        });
      });
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
            //if(IntlStore.getState().currentLocale === "zh"){
              let labels = IntlStore.getState().currentLocale === "zh" ? json.result[0].indexlabels : json.result[0].indexlabelsen;
              labels = labels.replace("，",",");
              labels = labels.replace(new RegExp("\\[","gm"),"");
              labels = labels.split("],").join("-*-");
              labels = labels.replace(new RegExp(",","gm"),"/");
            labels = labels.replace(new RegExp("\\]","gm"),"");
              object.labelArrays = labels.split("-*-");
           // }else{
           //   let labels = json.result[0].indexlabelsen;
           //   object.labelArrays = labels.split(",");
          //  }
            object.roomList = json.result[0].roomoidlist.split(",");
            object.enableWhiteList = json.result[0].enablewhitelist === "true";
            object.whiteList = json.result[0].whitelist.split(",");
            object.excludedHouses = json.result[0].excludedhouses ? json.result[0].excludedhouses.split(",") : [];
            object.excludedRooms = json.result[0].excludedrooms ? json.result[0].excludedrooms.split(",") : [];
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
                roomList:houseObj.roomList,
                enableWhiteList:houseObj.enableWhiteList,
                whiteList:houseObj.whiteList,
                excludedHouses:houseObj.excludedHouses,
                excludedRooms:houseObj.excludedRooms,


                // excludedRooms:["1.15.54"],
              // enableWhiteList:true,
              // whiteList:["1.14.1"],
            //roomList:["1.15.10","1.15.1642","1.15.1628"],
                images
          });
        });
    }

    _initHouseList(){

    }

    _getNotice(){
        WebApi.getBlockRecords(20,"40-54").then(records=>this.setState({noticeList: records}))
    }

    componentDidMount(){
      this._initData.bind(this)();

      this._getNotice.bind(this)();
      this.getNoticeTimer = setInterval(
           () => this._getNotice.bind(this)(),
           1000 * 60
      );
    }

    componentWillUnmount(){
        clearInterval(this.getNoticeTimer)
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
        if(this.props.children){
          this.props.router.push("/prediction");
        }
        this.setState({
          currentLabel:entry
        });
    }

    _onSelectRoom(room,optionIdx){
        let myRooms = this.state.myRooms;

        if(!_.find(myRooms, { 'id': room.id, 'selectOption': optionIdx })){
            let roomCopy = _.clone(room);
            roomCopy.selectOption = optionIdx;
            myRooms.push(roomCopy);

            this.setState({
                myRooms
            })
        }
    }

    _onCloseRoom(room){
        let myRooms = this.state.myRooms;
        _.remove(myRooms, r => r.id === room.id && r.selectOption === room.selectOption);
        this.setState({
            myRooms
        })

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

        const noticeSettings = {
            vertical: true,
            arrows:false,
            autoplay: true,
            autoplaySpeed: 3000
        };


        return (
          <div className="houses_index_container">
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

              {
                this.props.children ? <div className="middle-content" style={{flex:1}}>
                    {this.props.children}
                </div>
                  :
                <div className="middle-content" style={{flex:1}}>
                  <div className="notice flex-align-middle">
                      <div className="icon-container">
                        <i className="iconfont icon-gonggao1"></i>
                      </div>
                      <div className="notice-content">
                          <Slider {...noticeSettings}>
                              {
                                  this.state.noticeList.map(h=>{
                                      return (
                                          <Operation
                                              key={h.id}
                                              op={h.operations}
                                              result={h.operationResults}
                                              block={h.blockHeight}
                                              hideFee={true}
                                              withTxId={true}
                                              timeTd={true}
                                              txId={h.txId}
                                              hideOpLabel={false}
                                              current={"1.2.0"}/>
                                      );
                                  })
                              }
                          </Slider>
                      </div>
                  </div>
                  <div className="houses-category">
                    <ul>
                      <li className={"house-category" + (this.state.filterRoomType === 1 ? " checked" :"")} onClick={e => this.setState({filterRoomType:1})}>PVP</li>
                      <li className={"house-category" + (this.state.filterRoomType === 0 ? " checked" :"")} onClick={e => this.setState({filterRoomType:0})}>PVD</li>
                      <li className={"house-category" + (this.state.filterRoomType === 2 ? " checked" :"")} onClick={e => this.setState({filterRoomType:2})}>ADV</li>
                      <li className={"house-sort sort-container" + (this.state.sortBy === 0 ? " " + this.state.sortType : "")} onClick={e => this.setState({sortBy:0,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
                            最新参与&nbsp;
                            <Icon size="14px" name="sort"/>
                      </li>
                      <li className={"house-sort sort-container" + (this.state.sortBy === 1 ? " " + this.state.sortType : "")} onClick={e => this.setState({sortBy:1,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
                            参与总量&nbsp;
                            <Icon size="14px" name="sort"/>
                      </li>
                      <li className={"house-sort sort-container" + (this.state.sortBy === 2 ? " " + this.state.sortType : "")} onClick={e => this.setState({sortBy:2,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
                            参与人数&nbsp;
                            <Icon size="14px" name="sort"/>
                      </li>
                      <li className={"house-sort sort-container" + (this.state.sortBy === 3 ? " " + this.state.sortType : "")} onClick={e => this.setState({sortBy:3,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
                            结束时间&nbsp;
                            <Icon size="14px" name="sort"/>
                      </li>
                      <li className={"house-sort sort-container" + (this.state.sortBy === 4 ? " " + this.state.sortType : "")} onClick={e => this.setState({sortBy:4,sortType: this.state.sortType === "asc" ? "desc" : "asc"})}>
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
                              <Link to={"/prediction/rooms/" + item[1]} style={{background:"url(" + item[0] + ")"}}/>
                            </div>
                          );
                        })
                      }
                    </Slider>
                  </div>
                  <div style={{marginTop:"26px"}}>
                    <HouseList
                      current_aslot={dynGlobalObject.current_aslot}
                      current={current ? current.get("id") : null}
                      witnesses={Immutable.List(globalObject.active_witnesses)}
                      witnessList={globalObject.active_witnesses}
                      filter={this.state.filterWitness}
                      cardView={this.state.cardView}
                      filterLabel={this.state.currentLabel}
                      filterRoomType={this.state.filterRoomType}
                      sortBy={this.state.sortBy}
                      sortType={this.state.sortType}
                      houses={this.state.houses}
                      recommendRooms={this.state.roomList}
                      enableHousesWhiteList={this.state.enableWhiteList}
                      housesWhiteList={this.state.whiteList}
                      excludedHouses={this.state.excludedHouses}
                      excludedRooms={this.state.excludedRooms}
                      onRoomOptionCheck={(room,idx)=>{
                          this._onSelectRoom.bind(this)(room,idx);
                      }}
                    />
                  </div>
                </div>
              }
              {
                this.props.children ? null :
                  <div style={{ width: 297, marginRight: 20, marginTop: 20 }}>
                      {
                          this.state.myRooms.length > 0 ?
                          <TitlePanel title="seer.house.my_oracle">
                            <MyRoomList rooms={this.state.myRooms} onClose={this._onCloseRoom.bind(this)}/>
                          </TitlePanel>
                          : null
                      }

                    <TitlePanel title="seer.house.creator_rank">
                      <RankList houses={this.state.houses}/>
                    </TitlePanel>
                    <TitlePanel title="seer.house.oracle_rank">
                      <RankList oracles={this.state.oracles}/>
                    </TitlePanel>
                  </div>
              }
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