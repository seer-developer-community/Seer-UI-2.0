import React from "react";
import Immutable from "immutable";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {ChainStore} from "seerjs/es";
import FormattedAsset from "../Utility/FormattedAsset";
import Translate from "react-translate-component";
import { connect } from "alt-react";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import Explorer from "./Explorer";
import counterpart from "counterpart";

class CommitteeMemberCard extends React.Component {

    static propTypes = {
        committee_member: ChainTypes.ChainAccount.isRequired
    };

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    _onCardClick(e) {
        e.preventDefault();
        this.context.router.push(`/account/${this.props.committee_member.get("name")}`);
    }

    render() {
        let committee_member_data = ChainStore.getCommitteeMemberById( this.props.committee_member.get("id") );

        if (!committee_member_data) {
            return null;
        }

        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card" style={{background:"#fff",border:"1px solid #EFEFEF"}}>
                    <div style={{height:60,lineHeight:"60px",background:"#f2f2f2",fontSize:"20px",color:"#0c0D26",fontWeight:"bold",textAlign:"center"}}>
                      #{this.props.rank}:{this.props.committee_member.get("name")}
                    </div>
                    <div className="card-content clearfix">
                        <div style={{textAlign:"center",marginTop:"15px"}}>
                            <AccountImage account={this.props.committee_member.get("name")} size={{height: 80, width: 80}}/>
                        </div>
                        <div style={{fontSize:"14px",color:"#666",margin:"31px 0 18px 0",textAlign:"center"}}>
                          <Translate content="account.votes.votes" />: <FormattedAsset decimalOffset={5} amount={committee_member_data.get("total_votes")} asset={"1.3.0"}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
CommitteeMemberCard = BindToChainState(CommitteeMemberCard, {keep_updating: true});

class CommitteeMemberRow extends React.Component {

    static propTypes = {
        committee_member: ChainTypes.ChainAccount.isRequired
    };

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    _onRowClick(e) {
        e.preventDefault();
        this.context.router.push(`/account/${this.props.committee_member.get("name")}`);
    }

    render() {
        let {committee_member, rank} = this.props;
        let committee_member_data = ChainStore.getCommitteeMemberById( committee_member.get("id") );
        if ( !committee_member_data ) return null;

        let url = committee_member_data.get("url");
        url = url && url.length > 0 && url.indexOf("http") === -1 ? "http://" + url : url;

        return (
            <tr>
                <td onClick={this._onRowClick.bind(this)}>{rank}</td>
                <td onClick={this._onRowClick.bind(this)}>{committee_member.get("name")}</td>
                <td onClick={this._onRowClick.bind(this)}><FormattedAsset amount={committee_member_data.get("total_votes")} asset="1.3.0" /></td>
                <td><a href={url} rel="noopener noreferrer" target="_blank">{committee_member_data.get("url")}</a></td>
            </tr>
        );
    }
}
CommitteeMemberRow = BindToChainState(CommitteeMemberRow, {keep_updating: true});

class CommitteeMemberList extends React.Component {
    static propTypes = {
        committee_members: ChainTypes.ChainObjectsList.isRequired
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
        let {committee_members, cardView, membersList} = this.props;
        let {sortBy, inverseSort} = this.state;

        let itemRows = null;

        let ranks = {};

        committee_members
        .filter(a => {
            if (!a) {
                return false;
            }
            return membersList.indexOf(a.get("id")) !== -1;
        })
        .sort((a, b) => {
            if (a && b) {
                return parseInt(b.get("total_votes"), 10) - parseInt(a.get("total_votes"), 10);
            }
        })
        .forEach( (c, index) => {
            if (c) {
                ranks[c.get("id")] = index + 1;
            }
        });

        if (committee_members.length > 0 && committee_members[1]) {
            itemRows = committee_members
                .filter(a => {
                    if (!a) {return false; }
                    let account = ChainStore.getObject(a.get("committee_member_account"));
                    if (!account) { return false; }

                    return account.get("name").indexOf(this.props.filter) !== -1;

                })
                .sort((a, b) => {
                    let a_account = ChainStore.getObject(a.get("committee_member_account"));
                    let b_account = ChainStore.getObject(b.get("committee_member_account"));
                    if (!a_account || !b_account) {
                        return 0;
                    }

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
                            <CommitteeMemberRow key={a.get("id")} rank={ranks[a.get("id")]} committee_member={a.get("committee_member_account")} />
                        );
                    } else {
                        return (
                            <CommitteeMemberCard key={a.get("id")} rank={ranks[a.get("id")]} committee_member={a.get("committee_member_account")} />
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
                            <th width="25%" className="clickable" onClick={this._setSort.bind(this, 'rank')}><Translate content="explorer.witnesses.rank" /></th>
                            <th width="25%" className="clickable" onClick={this._setSort.bind(this, 'name')}><Translate content="account.votes.name" /></th>
                            <th width="25%" className="clickable" onClick={this._setSort.bind(this, 'total_votes')}><Translate content="account.votes.votes" /></th>
                            <th width="25%"><Translate content="account.votes.url" /></th>
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
                <div className="grid-block no-margin small-up-1 medium-up-2 large-up-3">
                    {itemRows}
                </div>
            );
        }
    }
}
CommitteeMemberList = BindToChainState(CommitteeMemberList, {keep_updating: true, show_loader: true});

class CommitteeMembers extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        globalObject: "2.0.0"
    }

    constructor(props) {
        super(props);
        this.state = {
            filterCommitteeMember: props.filterCommitteeMember || "",
            cardView: props.cardView
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.globalObject, this.props.globalObject) ||
            nextState.filterCommitteeMember !== this.state.filterCommitteeMember ||
            nextState.cardView !== this.state.cardView
        );
    }

    _onFilter(e) {
        e.preventDefault();
        this.setState({filterCommitteeMember: e.target.value.toLowerCase()});

        SettingsActions.changeViewSetting({
            filterCommitteeMember: e.target.value.toLowerCase()
        });
    }

    _toggleView() {
        SettingsActions.changeViewSetting({
            cardViewCommittee: !this.state.cardView
        });

        this.setState({
            cardView: !this.state.cardView
        });
    }

    render() {
        let {globalObject} = this.props;
        globalObject = globalObject.toJS();

        let activeCommitteeMembers = [];
        for (let key in globalObject.active_committee_members) {
            if (globalObject.active_committee_members.hasOwnProperty(key)) {
                activeCommitteeMembers.push(globalObject.active_committee_members[key]);
            }
        }

        let placeholder = counterpart.translate("markets.input_account_filter").toUpperCase();

        let content =
          <div style={{padding:"37px 20px 20px 20px"}}>

              <table width="100%">
                  <tr>
                        <td>
                          <div style={{fontSize:16,color:"#0c0d26",fontWeight:"bold",display:"inline-block"}}>
                            <Translate content="explorer.committee_members.active" />: {Object.keys(globalObject.active_committee_members).length}
                          </div>
                        </td>
                        <td style={{"text-align":"right"}}>
                          <div style={{display:"inline-block"}}>
                            <div className="input-search" style={{marginBottom: "1rem",maxWidth: "16rem"}} >
                              <svg className="icon" aria-hidden="true">
                                <use xlinkHref="#icon-sousuo"></use>
                              </svg>
                              <input placeholder={placeholder} type="text" value={this.state.filterCommitteeMember} onChange={this._onFilter.bind(this)} />
                            </div>
                          </div>
                          &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp;
                            <span className="flex-align-middle" onClick={this._toggleView.bind(this)} style={{color:"#449E7B",fontSize:"15px",float:"right",position:"relative",top:20}}>
                              <svg className="icon" aria-hidden="true" style={{width:18,height:18}}>
                                <use xlinkHref="#icon-qiapianshitu"></use>
                              </svg>
                                &nbsp;&nbsp;
                                {
                                  !this.state.cardView ? <Translate content="explorer.witnesses.card"/> : <Translate content="explorer.witnesses.table"/>
                                }
                          </span>
                        </td>
                  </tr>
              </table>
                <br/><br/>
            <CommitteeMemberList
              committee_members={Immutable.List(globalObject.active_committee_members)}
              membersList={globalObject.active_committee_members}
              filter={this.state.filterCommitteeMember}
              cardView={this.state.cardView}
            />
          </div>
        ;
        
        return content;//(<Explorer tab="committee_members" content={content}/>);
        
    }
}
CommitteeMembers = BindToChainState(CommitteeMembers, {keep_updating: true});

class CommitteeMembersStoreWrapper extends React.Component {
    render () {
        return <CommitteeMembers {...this.props}/>;
    }
}

CommitteeMembersStoreWrapper = connect(CommitteeMembersStoreWrapper, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            cardView: SettingsStore.getState().viewSettings.get("cardViewCommittee"),
            filterCommitteeMember: SettingsStore.getState().viewSettings.get("filterCommitteeMember"),
        };
    }
});

export default CommitteeMembersStoreWrapper;
