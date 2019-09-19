import React from "react";
import Translate from "react-translate-component";
import {Apis} from "seerjs-ws";
import SeerActions from "../../actions/SeerActions";
import BindToChainState from "../Utility/BindToChainState";
import AmountSelector from "../Utility/AmountSelector";
import FormattedAsset from "../Utility/FormattedAsset";
import BaseModal from "../Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import { websiteAPIs } from "../../api/apiConfig";
import IntlStore from "../../stores/IntlStore";
import counterpart from "counterpart";
import Msg from "../Utility/Msg";
import TransactionConfirmStore from "../../stores/TransactionConfirmStore";

require("./AccountRoomCreate.scss");

class AccountRoomCreate extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            assets: [],
            label: [],
            description: "",
            script: "",
            room_type: this.props.params &&this.props.params.ok=="true"?1:0,
            selections: [["",""]],
            awards: [["",""]],
            group_titles:[""],
            accept_asset: "1.3.0",
            accept_asset_precision:100000,
            accept_asset_symbol:"SEER",
            min: 0,
            max: 0,
            L: 0,
            pool: 0,
            pool2modified: 0,
            result_owner_percent: 0,
            reward_per_oracle: 0,
            reputation: 0,
            guaranty: 0,
            volume: 0,
            pvp_owner_percent:0,
            owner_pay_fee_percent:0,
            labelList:[],
            input_label:"",
            select_label:"-1",
            roomCreateMode:1, //1 普通 2 高级
            groupId:null,
            currentCreateIndex:0
           // all_oracles: []
           // allowed_oracles: [] //set as account names eg:a,b,ss,seer,cef,
        };

        if (props.room) {
            var room = props.room.toJS();
            this.state = {
                assets: [],
                label: room.label,
                description: room.description,
                script: room.script,
                room_type: room.room_type,
                accept_asset: room.option.accept_asset,
                accept_asset_precision: 100000,
                accept_asset_symbol: "SEER",
                min: room.option.minimum / 100000, // need get from store?
                max: room.option.maximum / 100000,
                L: 0,
                pool: 0,
                pool2modified: 0,
                awards: [[]],
                result_owner_percent: room.option.result_owner_percent/100,
                reward_per_oracle: room.option.reward_per_oracle/100000,
                reputation: room.option.filter.reputation,
                guaranty: room.option.filter.guaranty/100000,
                volume: room.option.filter.volume,
                selections: [room.running_option.selection_description],
                pvp_owner_percent:room.running_option.pvp_owner_percent,
                owner_pay_fee_percent:room.owner_pay_fee_percent,
                roomCreateMode:1,
                group_titles:[""],
                descPrefix:""
                //all_oracles: [],
                //allowed_oracles: room.option.allowed_oracles
            };

            if (room.room_type === 0) {
                this.state.L = room.running_option.lmsr.L;
            }else if (room.room_type === 2) {
                this.state.pool = room.running_option.advanced.pool;
                this.state.awards[0] = room.running_option.advanced.awards.map(a => {return a/10000;})
            }
            //
            // let prefix = room.description.substring(0,room.description.indexOf("-#@)")+4);
            // let desc = room.description.substring(room.description.indexOf("-#@)")+4);
            // console.log(desc);
        }

        this.txListen = this._listen.bind(this);
    }

    _updateRoomAward() {
        let args = {
            issuer: this.props.account.get("id"),
            room:this.props.room.get("id"),
            new_awards: (this.props.room.get("room_type") === 2)?this.state.awards.map(a => {return parseInt(a*10000);}):null
        };

        SeerActions.updateRoom(args);
    }

    _updatePool() {
        let args = {
            issuer: this.props.account.get("id"),
            room: this.props.room.get("id"),
            amount: {
                amount: this.state.pool2modified * this.state.accept_asset_precision,
                asset_id: "1.3.0"
            }
        };
        SeerActions.updatePool(args);
    }

    _updateRoom() {
        let args = {
            issuer: this.props.account.get("id"),
            room:this.props.room.get("id"),
            description: this.state.description,
            script: this.state.script,
            option: {
                result_owner_percent: parseInt(this.state.result_owner_percent*100),
                reward_per_oracle: parseInt(this.state.reward_per_oracle*100000),
                accept_asset: this.state.accept_asset,
                minimum: parseInt(this.state.min*this.state.accept_asset_precision),
                maximum: parseInt(this.state.max*this.state.accept_asset_precision),
                start: new Date(),
                stop: new Date(),
                input_duration_secs: 60,
                filter: {
                    reputation: this.state.reputation,
                    guaranty: parseInt(this.state.guaranty*100000),
                    volume: this.state.volume
                },
               // allowed_oracles: this.state.allowed_oracles.map(a => {for(var i=0; i<this.state.all_oracles.length;i++){if(this.state.all_oracles[i][0] === a) { return this.state.all_oracles[i][1]}};return null; })
                allowed_countries:[],
                allowed_authentications:[]
            },
            initial_option:{
                room_type: this.state.room_type,
                selection_description: this.state.selections[0],
                range: this.state.selections[0].length
            }
        };

        if (this.state.room_type === 0) {
            args.initial_option.lmsr = {
                L: parseInt(this.state.L)
            };
        } else if (this.state.room_type === 2) {
            args.initial_option.advanced = {
                pool: parseInt(this.state.pool),
                awards: this.state.awards[0].map(a => {return parseInt(a*10000);})
            };
        }

        if(this.state.pvp_owner_percent && this.state.pvp_owner_percent > 0){
            args.upgrade_option = {
                pvp_owner_percent:this.state.pvp_owner_percent
            };
        }

        if(this.state.owner_pay_fee_percent && this.state.owner_pay_fee_percent > 0){
            if(args.upgrade_option)
                args.upgrade_option.owner_pay_fee_percent = this.state.owner_pay_fee_percent;
            else
                args.upgrade_option = {
                    owner_pay_fee_percent:this.state.owner_pay_fee_percent
                };

        }

        SeerActions.updateRoom(args);
    }

    _onCreateRoom() {
      if (this.state.roomCreateMode === 1) {
        this._createRoom(0);
      } else {
          let emptyIndex =  _.findIndex(this.state.group_titles,(t)=>_.isEmpty(_.trim(t)));
          if(emptyIndex!==-1){
            Msg.error("seer.room.msg_group_title_empty",{ index : emptyIndex + 1 });
            return;
          }

        _.forIn(_.countBy(this.state.group_titles), function(value, key) {
            if(value > 1){
              Msg.error("seer.room.msg_group_title_repeat",{ title : key});
              return false;
            }
        });

        this.state.currentCreateIndex = 0;
        this.state.groupId = new Date().getTime();
        this._createRoom(0);
      }
    }

    _createRoom(groupIndex) {
        let desc = this.state.description;
        if(this.state.roomCreateMode ===2){
            desc = "(@#-" +"("+ this.state.groupId +")"+ this.state.group_titles[groupIndex] + "-#@)" + desc;
        }

        let args = {
            issuer: this.props.account.get("id"),
            label: this.state.label.filter(l => {return l.trim() !== "";}),
            description: desc,
            script: this.state.script,
            room_type: this.state.room_type,
            option: {
                result_owner_percent: parseInt(this.state.result_owner_percent*100),
                reward_per_oracle: parseInt(this.state.reward_per_oracle*100000),
                accept_asset: this.state.accept_asset,
                minimum: parseInt(this.state.min*this.state.accept_asset_precision),
                maximum: parseInt(this.state.max*this.state.accept_asset_precision),
                start: new Date(),
                stop: new Date(),
                input_duration_secs: 60,
                filter: {
                    reputation: this.state.reputation,
                    guaranty: parseInt(this.state.guaranty*100000),
                    volume: this.state.volume
                },
                allowed_oracles:[],
                allowed_countries:[],
                allowed_authentications:[]
                //allowed_oracles: this.state.allowed_oracles.map(a => { console.log(a); for(var i=0; i<this.state.all_oracles.length;i++){if(this.state.all_oracles[i][0] === a) { return this.state.all_oracles[i][1]}};return null; })
            },
            initial_option:{
                room_type: this.state.room_type,
                selection_description: this.state.selections[groupIndex],
                range: this.state.selections[groupIndex].length
            }
        };
        if (this.state.room_type === 0) {
            args.initial_option.lmsr = {
                L: parseInt(this.state.L)
            };
        } else if (this.state.room_type === 2) {
            args.initial_option.advanced = {
                pool: parseInt(this.state.pool),
                awards: this.state.awards[groupIndex].map(a => {return parseInt(a*10000);})
            };
        }

        if(this.state.pvp_owner_percent && this.state.pvp_owner_percent > 0){
            args.upgrade_option = {
                pvp_owner_percent:this.state.pvp_owner_percent
            };
        }

        if(this.state.owner_pay_fee_percent && this.state.owner_pay_fee_percent > 0){
            if(args.upgrade_option)
                args.upgrade_option.owner_pay_fee_percent = this.state.owner_pay_fee_percent;
            else
                args.upgrade_option = {
                    owner_pay_fee_percent:this.state.owner_pay_fee_percent
                };

        }

        if(this.state.roomCreateMode === 2) {
          TransactionConfirmStore.unlisten(this.txListen);
          TransactionConfirmStore.listen(this.txListen);
        }

        SeerActions.createRoom(args);
    }

    _listen(confirm_store_state){
      if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            TransactionConfirmStore.unlisten(this.txListen);
            this.state.currentCreateIndex++;
            if(this.state.currentCreateIndex < this.state.group_titles.length){
                  setTimeout(()=>{
                    this._createRoom(this.state.currentCreateIndex);
                  });
            }else{
                this.state.currentCreateIndex = 0;
                setTimeout(()=> {
                    Msg.success("seer.room.msg_group_all_created", { count: this.state.group_titles.length });
                });
            }
      }
    }

    componentWillMount() {
        Apis.instance().db_api().exec("list_assets", ["A", 100]).then((results) => {
            this.setState({assets: results});
            for( var i = 0;i<this.state.assets.length;i++){
                if(this.state.assets[i].id === this.state.accept_asset )
                {
                    let a = this.state.assets[i];
                    this.setState({accept_asset_precision:Math.pow(10,parseInt(a.precision)),accept_asset_symbol:a.symbol});
                    break;
                }
            }
        });

      fetch(websiteAPIs.BASE + websiteAPIs.HOUSES_LABEL_LIST, {
        method:"post",
        mode:"cors"
      }).then((response) => response.json())
        .then( json => {
          let labels = [];
          if(json && json.result && json.result.length > 0){
            if(IntlStore.getState().currentLocale === "zh"){
              labels = json.result[0].roomlabels.split(",");
            }else{
              labels = json.result[0].roomlabelsen.split(",");
            }
          }

          this.setState({
            labelList:labels || []
          });
        });

/*
        this.setState({assets: AssetStore.getState().assets});
            Apis.instance().db_api().exec("lookup_oracle_accounts", ["A", 1000]).then((results) => {
            this.setState({all_oracles: results});
            console.log(results);
            if (this.props.room) {
                var tmp = this.state.allowed_oracles.map(o => {
                    for (var i in results) {
                        if (results[i][1] == o) {
                            return results[i][0];
                        }
                    }
                });
                this.setState({allowed_oracles: tmp});
            }
        });*/
    }

    _changeLabel(i, e) {
        let labels = this.state.label;
        labels[i] = e.target.value;
        this.setState({label: labels});
    }

    _changeAwards(groupIndex,i, e) {
        let awards = this.state.awards;
        awards[groupIndex][i] = e.target.value;
        this.setState({awards: awards});
    }

    _changeDescription(e) {
        this.setState({description: e.target.value});
    }

    _changeScript(e) {
        this.setState({script: e.target.value});
    }

    _changeRoomType(val) {
        this.setState({room_type: parseInt(val)});
    }

    _changeRoomSelections(groupIndex,i, e) {
        let selections = this.state.selections;
        selections[groupIndex][i] = e.target.value;
        this.setState({selections: selections});
    }

    _addLabel() {
        ZfApi.publish("room_label_modal", "open");
    }

    _addLabelOk(){
        let label = this.state.select_label;
        if(label === "-1"){
            label = this.state.input_label;
        }

        if(!label || label.trim().length === 0){
            return;
        }

          let labels = this.state.label;
          labels.push(label);
          this.setState({label: labels});

        ZfApi.publish("room_label_modal", "close");
    }

    _removeLabel(idx) {
        console.log(idx);
        let labels = this.state.label;
        labels.splice(idx, 1);
        this.setState({label: labels});
    }

    _addSelection(groupIndex) {
        let selections = this.state.selections;
        selections[groupIndex].push("");
        this.setState({selections: selections});
    }

    _onChangeGroupTitle(groupIndex,e) {
        let group_titles = this.state.group_titles;
        group_titles[groupIndex] = e.target.value;
        this.setState({group_titles: group_titles});
    }

    _removeSelection(groupIndex,idx) {
        let selections = this.state.selections;
        selections[groupIndex].splice(idx, 1);
        this.setState({selections: selections});
    }

    _addSelectionType2(groupIndex) {
        let selections = this.state.selections;
        selections[groupIndex].push("");
        this.setState({selections: selections});

        let awards = this.state.awards;
        awards[groupIndex].push("");
        this.setState({awards: awards});
    }

    _removeSelectionType2(groupIndex,idx) {
        let selections = this.state.selections;
        selections[groupIndex].splice(idx, 1);
        this.setState({selections: selections});

        let awards = this.state.awards;
        awards[groupIndex].splice(idx, 1);
        this.setState({awards: awards});
    }

    _addGroupItem() {
        let group_titles = this.state.group_titles;
        let selections = this.state.selections;
        let awards = this.state.awards;
        group_titles.push("");
        selections.push(["",""]);
        awards.push(["",""]);

        this.setState({
          group_titles: group_titles,
          selections:selections,
          awards:awards
        });
    }

    _removeGroupItem(groupIndex){
      let group_titles = this.state.group_titles;
      let selections = this.state.selections;
      let awards = this.state.awards;

      selections.splice(groupIndex, 1);
      awards.splice(groupIndex, 1);
      group_titles.splice(groupIndex, 1);

      this.setState({
        group_titles: group_titles,
        selections:selections,
        awards:awards
      });
    }
/*
    _addAllowedOracle() {
        let ao = this.state.allowed_oracles;
        ao.push("");
        this.setState({allowed_oracles: ao});
    }

    _removeAllowedOracle(idx) {
        let ao = this.state.allowed_oracles;
        ao.splice(idx, 1);
        this.setState({allowed_oracles: ao});
    }

    _changeAllowedOracle(i, e) {
        let ao = this.state.allowed_oracles;
        ao[i] = e.target.value;
        this.setState({allowed_oracles: ao});
    }
*/
    renderOptions(){
        if(this.state.roomCreateMode === 1){
            return (
              <div className="general-options">
                {this.renderOptionGroupItem(0)}
              </div>
            );
        }else{
          return (
            <div className="super-options">
              <div className="flex-align-middle align-right">
                <button className="button option-group-action-btn" onClick={this._addGroupItem.bind(this)}>
                  <span>✚</span>
                  <Translate content="seer.room.add_option_group"/>
                </button>
              </div>
              <br/><br/>
              {
                  this.state.selections.map((s,i)=>{
                    return (
                      <div className="super-options-group" key={i}>
                          <input type="text" placeholder={counterpart.translate("seer.room.input_option_group_title")} value={this.state.group_titles[i]}
                                 onChange={this._onChangeGroupTitle.bind(this,i)}/>
                        {this.renderOptionGroupItem(i)}
                        <div className="flex-align-middle align-right">
                          <button className="button option-group-action-btn" onClick={this._removeGroupItem.bind(this,i)}>
                            <span>━</span>
                            <Translate content="seer.room.remove_option_group"/>
                          </button>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          );
        }
    }

    renderOptionGroupItem(groupIndex){

        let selections = this.state.selections[groupIndex];
        let awards = this.state.awards[groupIndex];

        if(this.state.room_type !== 2){
            return (
              <div className="room-option-group-item" key={groupIndex}>
                <div className="add-option">
                  <Translate content="seer.room.add_selection"/>
                  <button className="button" onClick={this._addSelection.bind(this,groupIndex)}>✚</button>
                </div>
                {
                  selections.length ?
                    <div className="room-options">
                      {
                        selections.map((s,i) => {
                          return (
                            <div className="option-item" key={groupIndex + "-" +i}>
                              <input type="text" placeholder={counterpart.translate("seer.room.room_option_desc")} value={s} onChange={this._changeRoomSelections.bind(this,groupIndex, i)}/>
                              <button onClick={this._removeSelection.bind(this,groupIndex, i)}><Translate content="settings.remove"/></button>
                            </div>
                          );
                        })
                      }
                    </div>:null
                }
              </div>
            );
        }else{
            return (
              <div className="room-option-group-item" key={groupIndex}>
                <div className="add-option">
                  <Translate content="seer.room.add_selection"/>
                  <button className="button" onClick={this._addSelectionType2.bind(this,groupIndex)}>✚</button>
                </div>
                {
                  selections.length ?
                    <div className="room-options">
                      {
                        selections.map((s,i) => {
                          return (
                            <div className="option-item" key={groupIndex + "-" +i}>
                              <input type="text" placeholder={counterpart.translate("seer.room.room_option_desc")} value={s} onChange={this._changeRoomSelections.bind(this,groupIndex, i)}/>
                              <input type="text" placeholder={counterpart.translate("seer.room.awards")} value={awards[i]} onChange={this._changeAwards.bind(this,groupIndex, i)}/>
                              <button onClick={this._removeSelectionType2.bind(this,groupIndex, i)}><Translate content="settings.remove"/></button>
                            </div>
                          );
                        })
                      }
                    </div>:null
                }
              </div>
            );
        }
    }

    render() {
        let type_opts = [
            {label: "PVD", value: 0},
            {label: "PVP", value: 1},
            {label: "Advanced", value: 2},
        ];

        let i = 0;

        let type_options = [];
        if(this.props.room){
            type_options.push(<button key={this.state.room_type} className={"button btn-room-type"}>{this.state.room_type === 0 ? "PVD" : this.state.room_type === 1 ? "PVP" : "Advanced"}</button>)
        }else{
            type_opts.forEach( opt => {
                let selected = opt.value === this.state.room_type ? "" : "outline";
                type_options.push(<button key={opt.value} className={"button btn-room-type " + selected} onClick={this._changeRoomType.bind(this,opt.value)}>{opt.label}</button>)
            });
        }

        let room_type;
        switch (this.state.room_type) {
            case 0:
                room_type = (
                    <div>
                      <span className="label-text" >
                        <Translate content="seer.room.L"/>
                        <i>*</i>
                      </span>
                      <input type="text" value={this.state.L/this.state.accept_asset_precision} onChange={e => this.setState({L: parseInt(e.target.value*this.state.accept_asset_precision)})}/>
                    </div>
                );
                break;
            case 1:
                room_type = (
                    <div>
                        <span className="label-text" >
                            <Translate content="seer.room.pvp_owner_percent"/>
                            <i>*</i>
                        </span>
                        <div className="unit-input">
                            <input type="text" value={this.state.pvp_owner_percent/100} onChange={e => this.setState({pvp_owner_percent:parseInt(e.target.value*100)})}/>
                            <i>%</i>
                        </div>
                    </div>
                );
                break;
            case 2:
                room_type = this.props.room ?null:(
                    <div>
                        <span className="label-text" >
                            <Translate content="seer.room.pool"/>
                            <i>*</i>
                        </span>
                        <input type="text" value={this.state.pool/this.state.accept_asset_precision} onChange={e => this.setState({pool:parseInt(e.target.value*this.state.accept_asset_precision)})}/>
                    </div>
                );
        }

        let supports = this.state.assets.map(a => {
            if(a.symbol == "SEER"){
                return (
                    <option selected  key={a.id} value={a.id}>{a.symbol}</option>
                );
            }
            else return (
                <option key={a.id} value={a.id}>{a.symbol}</option>
            );
        });

/*
        i = 0;
        let allowed_oracles = this.state.allowed_oracles.map(l => {
            let dom = (
                <tr key={i}>
                    <td><input type="text" value={this.state.allowed_oracles[i]} onChange={this._changeAllowedOracle.bind(this, i)}/></td>
                    <td>
                        <button className="button outline" onClick={this._removeAllowedOracle.bind(this, i)}>
                            <Translate content="settings.remove"/>
                        </button>
                    </td>
                </tr>
            );
            i++;
            return dom;
        });
*/


        let labels = this.state.label.map((l,index) => {
            if(this.props.room){
                return (
                  <span key={index} className="room-label">{l}</span>
                );
            }else{
                return (
                    <span key={index} className="room-label clickable" onDoubleClick={this._removeLabel.bind(this, index)}>{l}</span>
                );
            }
        });


        let awards_type2 = null;
        if(this.props.room && (this.props.room.toJS().room_type==2)){
            let i = 0;
            let this_selections = this.state.selections.map(s => {
                let dom = (
                    <tr key={i}>
                        <td>{s}</td>
                        <td><input type="text" value={this.state.awards[i]} onChange={this._changeAwards.bind(this, i)}/></td>
                    </tr>
                );
                i++;
                return dom;
            });

            awards_type2 =(
            <div>
                {
                    this.state.selections.length ?
                        <table>
                            <thead>
                            <tr>
                                <th>
                                    <Translate content="seer.room.selection_description"/>
                                </th>
                                <th><Translate content="seer.room.awards"/></th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {this_selections}
                            </tbody>
                        </table>
                        : null
                }
            </div>
        );
        }

        return (this.props.room &&  (this.props.room.toJS().status != "closed") && (this.props.room.toJS().status != "finished")  && (this.props.room.toJS().room_type == 2))?
        (
            <div className="grid-content no-padding account_room_create" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <div className="tabs-header">
                            <h3 style={{marginLeft:0,marginTop:30}}><Translate content="seer.room.update" /></h3>
                        </div>
                        <div className="small-12 grid-content" style={{padding: "15px"}}>
                            {awards_type2}
                            <button className="button" onClick={this._updateRoomAward.bind(this)}>
                                <Translate content="seer.room.update"/>
                            </button>
                            <div className="tabs-container generic-bordered-box">
                                <div className="tabs-header">
                                    <h3 style={{marginLeft:0,marginTop:30}}><Translate content="seer.room.update_pool" /></h3>
                                </div>
                                <div className="small-12 grid-content" style={{padding: "15px"}}>
                                    <Translate content="seer.room.pool_explain" />
                                    <FormattedAsset amount={this.state.pool} asset={this.state.accept_asset_symbol}/>
                                    <AmountSelector
                                        amount={this.state.pool2modified}
                                        onChange={(v) => this.setState({pool2modified: v.amount})}
                                        asset= {this.state.accept_asset}
                                        assets={[this.state.accept_asset]}
                                    />
                                    <button className="button" onClick={this._updatePool.bind(this)}>
                                        <Translate content="seer.room.update_pool"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        ): (/*here is create room*/
            <div className="grid-content no-padding account_room_create" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <div className="tabs-header">
                            {
                                this.props.room?
                                    <h3 style={{marginLeft:0,marginTop:30}}><Translate content="seer.room.update" /></h3>
                                    :
                                    <h3 style={{marginLeft:0,marginTop:30}}><Translate content="seer.room.create" /></h3>
                            }

                        </div>
                      <table className="room-table" width="100%">
                          <tbody>
                        <tr>
                          <td width="50%">
                              <span className="label-text" style={{marginBottom:22}}>
                                  <Translate content="seer.oracle.description" />
                                  <i>*</i>
                              </span>
                              <textarea onChange={this._changeDescription.bind(this)} value={this.state.description}>
                              </textarea>
                          </td>
                          <td width="50%">
                            <div>
                                <span className="label-text" style={{marginTop:10,marginBottom:10}}>
                                  <Translate content="seer.room.label"/>
                                  <i>*</i>
                                  {
                                      this.props.room ? null :
                                        <button className="button tiny btn-add-label" onClick={this._addLabel.bind(this)}>✚</button>
                                  }
                                  {
                                    this.props.room ? null :
                                      <Translate content="seer.room.click_label_remove" style={{fontWeight:"normal",fontSize:12,color:"#999"}}/>
                                  }
                                </span>
                                <div className="label-panel">
                                    {this.state.label.length ? labels : null}
                                </div>
                            </div>
                          </td>
                        </tr>
                          <tr>
                              <td>
                                {
                                  (this.props.params && this.props.params.ok==="true") ? null :(
                                    <div>
                                        <span className="label-text" >
                                          <Translate content="seer.room.type"/>
                                          <i>*</i>
                                        </span>
                                        <div>
                                          {
                                             type_options
                                          }
                                        </div>
                                    </div>
                                  )
                                }
                              </td>
                              <td>
                                {room_type}
                              </td>
                          </tr>
                          <tr>
                              <td>
                                  <span className="label-text" >
                                    <Translate content="seer.room.result_owner_percent" />
                                    <i>*</i>
                                  </span>
                                  <div className="unit-input">
                                    <input type="text"  value={this.state.result_owner_percent}  onChange={e => this.setState({result_owner_percent: e.target.value})}/>
                                    <i>%</i>
                                  </div>
                              </td>
                              <td>
                                <div>
                                    <span className="label-text" >
                                        <Translate content="seer.room.accept_asset"/>
                                        <i>*</i>
                                    </span>
                                  {
                                      this.props.room ?
                                        <input type="text" value={this.state.accept_asset_symbol} readOnly={true} disabled={true}/>
                                        :
                                        <select  onChange={e => {
                                          this.setState({accept_asset: e.target.value});
                                          let a;
                                          for( var i = 0;i<this.state.assets.length;i++){
                                            if(this.state.assets[i].id === e.target.value )
                                            {
                                              a = this.state.assets[i];
                                              break;
                                            }
                                          }
                                          this.setState({accept_asset_precision:Math.pow(10,parseInt(a.precision))});

                                          this.setState({accept_asset_symbol:a.symbol})}}>
                                          {supports}
                                        </select>
                                  }
                                </div>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                <span className="label-text" >
                                    <Translate content="seer.room.min" />
                                    <i>*</i>
                                </span>
                                <div className="unit-input">
                                  <input value={this.state.min} onChange={(e) => {this.setState({min: e.target.value});}} type="text"></input>
                                  <i>{this.state.room_type == 0?<Translate content="seer.room.part" />:this.state.accept_asset_symbol}</i>
                                </div>
                              </td>
                              <td>
                                <span className="label-text" >
                                    <Translate content="seer.room.max" />
                                    <i>*</i>
                                </span>
                                <div className="unit-input">
                                    <input value={this.state.max} onChange={(e) => {this.setState({max: e.target.value});}} type="text"></input>
                                    <i>{this.state.room_type == 0?<Translate content="seer.room.part" />:this.state.accept_asset_symbol}</i>
                                </div>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                <span className="label-text">
                                    <Translate content="seer.room.owner_pay_fee_percent" />
                                </span>
                                <div className="unit-input">
                                  <input type="text" value={this.state.owner_pay_fee_percent/100} onChange={e => this.setState({owner_pay_fee_percent:parseInt(e.target.value*100)})}/>
                                  <i>%</i>
                                </div>
                              </td>
                              <td>
                                <span className="label-text" >
                                    <Translate content="seer.oracle.script" />
                                </span>
                                <input type="text" value={this.state.script} onChange={this._changeScript.bind(this)}/>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                <br/><br/>
                                <Translate content="seer.room.guaranty_threshold" style={{fontSize:14,color:"#666"}}/>
                              </td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>
                                <span className="label-text" style={{marginBottom:3}}>
                                    <Translate content="seer.room.guaranty"/>
                                </span>
                                <AmountSelector style={{width:"100%"}} asset={"1.3.0"} assets={["1.3.0"]} amount={this.state.guaranty} onChange={data => this.setState({guaranty: data.amount})} />
                              </td>
                              <td>
                                  <span className="label-text">
                                    <Translate content="seer.room.reputation"/>
                                  </span>
                                <input type="text" value={this.state.reputation} onChange={e => this.setState({reputation: e.target.value})}/>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                <span className="label-text">
                                    <Translate content="seer.room.volume"/>
                                </span>
                                <input type="text"  value={this.state.volume} onChange={e => this.setState({volume: e.target.value})}/>
                              </td>
                              <td>
                                <span className="label-text">
                                    <Translate content="seer.room.reward_per_oracle" />
                                </span>
                                <div className="unit-input">
                                  <input type="text"  value={this.state.reward_per_oracle} onChange={e => this.setState({reward_per_oracle: e.target.value})}/>
                                  <i>SEER</i>
                                </div>
                              </td>
                          </tr>
                          </tbody>
                      </table>
                      {
                        this.props.room ? <div className="room-option-title"><hr/><Translate content="seer.room.selections"/><hr/></div> :
                            <div className="option-types">
                              <button className={"button" + (this.state.roomCreateMode === 1 ? " checked" : "") } onClick={()=>this.setState({roomCreateMode:1})}> <Translate content="seer.room.general_option" /></button>
                              <button className={"button" + (this.state.roomCreateMode === 2 ? " checked" : "") } onClick={()=>this.setState({roomCreateMode:2})}> <Translate content="seer.room.super_option" /></button>
                            </div>
                      }
                        <div className="small-12 grid-content" style={{padding: "0px"}}>

                          {this.renderOptions.bind(this)()}
                            <br/>
                            <br/>

                            <br/><br/>
                          <div style={{textAlign:"center"}}>
                            {
                                this.props.room ?
                                    <button className="button large" onClick={this._updateRoom.bind(this)}  style={{width:541,height:68,fontSize:18}}>
                                        <Translate content="seer.room.update"/>
                                    </button>
                                    :
                                    <button className="button large" onClick={this._onCreateRoom.bind(this)} style={{width:541,height:68,fontSize:18}}>
                                        <Translate content="seer.room.create_now"/>
                                    </button>
                            }
                          </div>
                        </div>


                      <BaseModal id="room_label_modal" overlay={true}>
                        <div>
                            <br/>
                            <span className="label-text">
                                <Translate content="seer.room.input_or_select_label"/>
                            </span>
                            <select onChange={e => {
                                if(e.target.value !== "-1"){
                                    this.state.input_label = "";
                                }
                              this.setState({ select_label: e.target.value });
                            }} value={this.state.select_label}>
                              <option value="-1"><Translate content="seer.room.label_use_input_value"/></option>
                              {
                                (this.state.labelList || []).map((item,index) => {
                                    return (
                                      <option value={item} key={index}>{item}</option>
                                    );
                                })
                              }
                            </select>
                            <br/>
                            <input disabled={this.state.select_label === "-1" ? "" : "disabled"} type="text" value={this.state.input_label} onChange={e => this.setState({input_label: e.target.value})}/>
                            <br/>
                            <br/>
                            <div style={{width:"100%",textAlign:"center"}}>
                                <button className="button" onClick={this._addLabelOk.bind(this)}>
                                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                  <Translate content="modal.ok"/>
                                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                </button>
                            </div>
                          <br/>
                        </div>
                      </BaseModal>
                    </div>
                </div>
            </div>
        );
    }
}

export default BindToChainState(AccountRoomCreate);
