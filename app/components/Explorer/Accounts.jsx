import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router/es";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import {debounce} from "lodash";
import ChainTypes from "../Utility/ChainTypes";
import Icon from "../Icon/Icon";
import BindToChainState from "../Utility/BindToChainState";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountStore from "stores/AccountStore";
import { connect } from "alt-react";
import counterpart from "counterpart";

class AccountRow extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        tempComponent: "tr",
        autosubscribe: false
    };

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.account !== this.props.account
        );
    }

    _onLinkAccount(account, e) {
        e.preventDefault();
        AccountActions.linkAccount(account);
    }

    _onUnLinkAccount(account, e) {
        e.preventDefault();
        AccountActions.unlinkAccount(account);
    }

    render() {
        let {account, linkedAccounts} = this.props;

        let balance = account.getIn(["balances", "1.3.0"]) || null;
        let accountName = account.get("name");

        return (
            <tr key={account.get("id")}>
                <td>{account.get("id")}</td>
                {linkedAccounts.has(accountName) ?
                  <td onClick={this._onUnLinkAccount.bind(this, accountName)}><Icon name="minus-circle" className="icon-18px"/></td>
                  :
                  <td onClick={this._onLinkAccount.bind(this, accountName)}><Icon name="plus-circle" className="icon-18px color-primary"/></td>
                }
                <td><Link to={`/account/${accountName}/overview`}>{accountName}</Link></td>
                <td>{!balance? "n/a" : <BalanceComponent balance={balance} />}</td>
                <td>{!balance ? "n/a" : <BalanceComponent balance={balance} asPercentage={true} />}</td>
            </tr>
        );
    }
}
AccountRow = BindToChainState(AccountRow);

let AccountRowWrapper = (props) => {
    return <AccountRow {...props} />;
};

AccountRowWrapper = connect(AccountRowWrapper, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            linkedAccounts: AccountStore.getState().linkedAccounts
        };
    }
});


class Accounts extends React.Component {

    constructor(props) {
        super();
        this.state = {
            searchTerm: props.searchTerm
        };

        this._searchAccounts = debounce(this._searchAccounts, 200);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
                !Immutable.is(nextProps.searchAccounts, this.props.searchAccounts) ||
                nextState.searchTerm !== this.state.searchTerm
            );
    }

    _onSearchChange(e) {
        this.setState({searchTerm: e.target.value.toLowerCase()});
        this._searchAccounts(e.target.value);
    }

    _searchAccounts(searchTerm) {
        AccountActions.accountSearch(searchTerm);
    }

    render() {
        let {searchAccounts} = this.props;
        let {searchTerm} = this.state;
        let accountRows = null;
        let placeholder = counterpart.translate("markets.input_code_filter").toUpperCase();

        if (searchAccounts.size > 0 && searchTerm &&searchTerm.length > 0) {
            accountRows = searchAccounts.filter(a => {
                return a.indexOf(searchTerm) !== -1;
            })
            .sort((a, b) => {
                if (a > b) {
                    return 1;
                } else if (a < b) {
                    return -1;
                } else {
                    return 0;
                }
            })
            .map((account, id) => {
                return (
                    <AccountRowWrapper key={id} account={account} />
                );
            }).toArray();
        }

        return (
            <div style={{padding:"50px 20px 70px 20px"}}>
              <div className="input-search" style={{marginBottom: "1rem",maxWidth: "16rem"}} >
                <svg className="icon" aria-hidden="true">
                  <use xlinkHref="#icon-sousuo"></use>
                </svg>
                <input placeholder={placeholder} type="text" value={this.state.searchTerm} onChange={this._onSearchChange.bind(this)}/>
              </div>

              <table className="table dashboard-table">
                <thead>
                <tr>
                  <th style={{background:"#F8F8FA",fontWeight:"bold"}}><Translate component="span" content="explorer.assets.id" /></th>
                  <th style={{background:"#F8F8FA",fontWeight:"bold"}}>
                    <svg className="icon" aria-hidden="true" style={{width:20,height:20}}>
                      <use xlinkHref="#icon-yonghu"></use>
                    </svg>
                  </th>
                  <th style={{background:"#F8F8FA",fontWeight:"bold"}}><Translate component="span" content="account.name" /></th>
                  <th style={{background:"#F8F8FA",fontWeight:"bold"}}><Translate component="span" content="gateway.balance" /></th>
                  <th style={{background:"#F8F8FA",fontWeight:"bold"}}><Translate component="span" content="account.percent" /></th>
                </tr>
                </thead>

                <tbody>
                {accountRows}
                </tbody>
              </table>
            </div>
        );
    }
}

Accounts.defaultProps = {
    searchAccounts: {}
};

Accounts.propTypes = {
    searchAccounts: PropTypes.object.isRequired
};

export default Accounts;
