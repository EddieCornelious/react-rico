import {Component, createElement} from 'react';
import defaultMapStateToProps from './defaultMapStateToProps.js';
import defaultMapDispatchToProps from './defaultMapDispatchToProps.js';
import shallowEqual from './shallowEqual.js';
import mergeObjs from './mergeObjs.js';

export default function connect(
  mapStateToProps = defaultMapStateToProps,
  mapDispatchToProps = defaultMapDispatchToProps
) {
  return function(store, componentToConnectToStore) {
    const stateMapperDependsOnProps = mapStateToProps.length > 1;
    const dispatchMapperDependsOnProps = mapDispatchToProps.length > 1;

    return class WrapperComponent extends Component {
      constructor(props) {
        super(props);
        this.state = {storeState: store.getState()};
        this.stateProps = mapStateToProps(this.state.storeState, props);
        this.dispatchProps = mapDispatchToProps(store.dispatch, props);
        this.storeHasChanged = false;
        this.propsHaveChanged = false;
        this.propsBeforeRender = props;
        this.renderedEle = createElement(
          componentToConnectToStore,
          mergeObjs(this.stateProps, this.dispatchProps, this.props)
        );
      }

      componentDidMount() {
        this.initSubscribe();
      }

      initSubscribe() {
        const self = this;

        if (!self.unsubscribe) {
          self.unsubscribe = store.subscribe(newState =>
            self.setState({
              storeState: newState
            })
          );
        }
      }

      componentWillUnmount() {
        this.unsubscribe();
      }

      shouldComponentUpdate(nextProps, nextState) {
        this.storeHasChanged = nextState !== this.state.storeState;
        this.propsBeforeRender = this.props;
        return true;
      }

      shouldUpdateStateProps() {
        const nextStateProps = mapStateToProps(store.getState(), this.props);

        if (shallowEqual(nextStateProps, this.stateProps)) {
          return false;
        }

        this.stateProps = nextStateProps;
        return true;
      }

      componentWillReceiveProps(nextProps) {
        this.propsHaveChanged = !shallowEqual(nextProps, this.props);
      }

      shouldUpdateDispatchProps() {
        const nextDispatchProps = mapDispatchToProps(
          store.dispatch,
          this.props
        );

        if (shallowEqual(nextDispatchProps, this.dispatchProps)) {
          return false;
        }

        this.dispatchProps = nextDispatchProps;
        return true;
      }

      render() {
        let stateMapperChanged = false;
        let dispatchMapperChanged = false;

        this.propsChanged = !shallowEqual(this.propsBeforeRender, this.props);

        if (
          this.storeHasChanged ||
          (this.propsHaveChanged && stateMapperDependsOnProps)
        ) {
          stateMapperChanged = this.shouldUpdateStateProps();
        }

        if (this.propsHaveChanged && dispatchMapperDependsOnProps) {
          dispatchMapperChanged = this.shouldUpdateDispatchProps();
        }

        if (
          this.propsHaveChanged ||
          stateMapperChanged ||
          dispatchMapperChanged
        ) {
          this.renderedEle = createElement(
            componentToConnectToStore,
            mergeObjs(this.stateProps, this.dispatchProps, this.props)
          );
        }
        return this.renderedEle;
      }
    };
  };
}
