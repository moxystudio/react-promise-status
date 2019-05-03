import React from 'react';
import { render } from 'react-testing-library';
import pDelay from 'delay';
import { usePromiseState } from '../src';
import hideGlobalErrors from './util/hide-global-errors';

const PromiseStatus = ({ promise, children, ...options }) => {
    const promiseState = usePromiseState(promise, options);

    return children(promiseState);
};

beforeEach(() => {
    // Hide "An update to null inside a test was not wrapped in act(...)" error
    // This won't be needed in react-dom@^16.9.0 because `act()` will support promises
    // See: https://github.com/facebook/react/issues/14769#issuecomment-479592338
    hideGlobalErrors();
});

it('should return the correct status and value when fullfilled', async () => {
    const childrenFn = jest.fn(() => <div>foo</div>);
    const promise = Promise.resolve('foo');

    render(
        <PromiseStatus promise={ promise }>
            { childrenFn }
        </PromiseStatus>
    );

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(2);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
});

it('should return the correct status and value when rejected', async () => {
    const error = new Error('foo');
    const promise = Promise.reject(error);
    const childrenFn = jest.fn(() => <div>foo</div>);

    promise.catch(() => {});

    render(
        <PromiseStatus promise={ promise }>
            { childrenFn }
        </PromiseStatus>
    );

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(2);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'rejected', value: error });
});

it('should return the correct status if there\'s no promise', async () => {
    const childrenFn = jest.fn(() => <div>foo</div>);

    render(
        <PromiseStatus>
            { childrenFn }
        </PromiseStatus>
    );

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(1);
    expect(childrenFn).toHaveBeenNthCalledWith(1, undefined);
});

it('should update correctly if promise changes', async () => {
    const promise1 = Promise.resolve('foo');
    const promise2 = Promise.resolve('bar');
    const childrenFn = jest.fn(() => <div>foo</div>);

    const { rerender } = render(
        <PromiseStatus promise={ promise1 }>
            { childrenFn }
        </PromiseStatus>
    );

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(2);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
    childrenFn.mockClear();

    rerender(
        <PromiseStatus promise={ promise2 }>
            { childrenFn }
        </PromiseStatus>
    );

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(3);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'fulfilled', value: 'foo' });
    expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'pending', value: undefined });
    expect(childrenFn).toHaveBeenNthCalledWith(3, { status: 'fulfilled', value: 'bar' });
});

it('should cleanup correctly if a fulfilled promise changes', async () => {
    const promise1 = Promise.resolve('foo');
    const promise2 = Promise.resolve('bar');
    const childrenFn = jest.fn(() => <div>foo</div>);

    const { rerender } = render(
        <PromiseStatus promise={ promise1 }>
            { childrenFn }
        </PromiseStatus>
    );

    expect(childrenFn).toHaveBeenCalledTimes(1);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    childrenFn.mockClear();

    rerender(
        <PromiseStatus promise={ promise2 }>
            { childrenFn }
        </PromiseStatus>
    );

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(2);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'bar' });
});

it('should cleanup correctly if a rejected promise changes', async () => {
    const promise1 = Promise.reject(new Error('foo'));
    const promise2 = Promise.resolve('bar');
    const childrenFn = jest.fn(() => <div>foo</div>);

    promise1.catch(() => {});

    const { rerender } = render(
        <PromiseStatus promise={ promise1 }>
            { childrenFn }
        </PromiseStatus>
    );

    expect(childrenFn).toHaveBeenCalledTimes(1);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    childrenFn.mockClear();

    rerender(
        <PromiseStatus promise={ promise2 }>
            { childrenFn }
        </PromiseStatus>
    );

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(2);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'bar' });
});

it('should cleanup correctly on unmount', async () => {
    const promise = Promise.resolve('foo');
    const childrenFn = jest.fn(() => <div>foo</div>);

    const { unmount } = render(
        <PromiseStatus promise={ promise }>
            { childrenFn }
        </PromiseStatus>
    );

    expect(childrenFn).toHaveBeenCalledTimes(1);
    expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    childrenFn.mockClear();

    unmount();

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(0);
});

it('should work well if no options are passed', async () => {
    const PromiseStatus = ({ promise, children }) => {
        const promiseState = usePromiseState(promise);

        return children(promiseState);
    };

    const childrenFn = jest.fn(() => <div>foo</div>);

    render(
        <PromiseStatus>
            { childrenFn }
        </PromiseStatus>
    );

    await pDelay(10);

    expect(childrenFn).toHaveBeenCalledTimes(1);
    expect(childrenFn).toHaveBeenNthCalledWith(1, undefined);
});

describe('statusMap option', () => {
    it('should map status correctly', async () => {
        const promise = Promise.resolve('foo');
        const statusMap = { pending: 'loading' };
        const childrenFn = jest.fn(() => <div>foo</div>);

        render(
            <PromiseStatus promise={ promise } statusMap={ statusMap }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'loading', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
    });

    it('should allow nulish map values', async () => {
        const promise = Promise.resolve('foo');
        const childrenFn = jest.fn(() => <div>foo</div>);
        const statusMap = { pending: null, fulfilled: undefined };

        render(
            <PromiseStatus promise={ promise } statusMap={ statusMap }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: null, value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: undefined, value: 'foo' });
    });

    it('should render correctly if statusMap changes', async () => {
        const promise = Promise.resolve('foo');
        const statusMap1 = { pending: 'loading' };
        const statusMap2 = { pending: 'buffering' };
        const childrenFn = jest.fn(() => <div>foo</div>);

        const { rerender } = render(
            <PromiseStatus promise={ promise } statusMap={ statusMap1 }>
                { childrenFn }
            </PromiseStatus>
        );

        expect(childrenFn).toHaveBeenCalledTimes(1);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'loading', value: undefined });
        childrenFn.mockClear();

        rerender(
            <PromiseStatus promise={ promise } statusMap={ statusMap2 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'buffering', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
    });
});

describe('delayMs option', () => {
    it('should not call with pending within delay', async () => {
        const promise = Promise.resolve('foo');
        const childrenFn = jest.fn(() => <div>foo</div>);

        render(
            <PromiseStatus promise={ promise } delayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, undefined);
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
    });

    it('should call with pending outside delay', async () => {
        const promise = pDelay(100).then(() => 'foo');
        const childrenFn = jest.fn(() => <div>foo</div>);

        render(
            <PromiseStatus promise={ promise } delayMs={ 1 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(3);
        expect(childrenFn).toHaveBeenNthCalledWith(1, undefined);
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(3, { status: 'fulfilled', value: 'foo' });
    });

    it('should render correctly if promise changes', async () => {
        const promise1 = Promise.resolve('foo');
        const promise2 = Promise.resolve('bar');
        const childrenFn = jest.fn(() => <div>foo</div>);

        const { rerender } = render(
            <PromiseStatus promise={ promise1 } delayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, undefined);
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
        childrenFn.mockClear();

        rerender(
            <PromiseStatus promise={ promise2 } delayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'fulfilled', value: 'foo' });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'bar' });
    });

    it('should cleanup correctly if promise changes in between', async () => {
        const promise1 = Promise.resolve('foo');
        const promise2 = Promise.resolve('bar');
        const childrenFn = jest.fn(() => <div>foo</div>);

        const { rerender } = render(
            <PromiseStatus promise={ promise1 } delayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        expect(childrenFn).toHaveBeenCalledTimes(1);
        expect(childrenFn).toHaveBeenNthCalledWith(1, undefined);
        childrenFn.mockClear();

        rerender(
            <PromiseStatus promise={ promise2 } delayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, undefined);
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'bar' });
    });

    it('should cleanup correctly on unmount', async () => {
        const childrenFn = jest.fn(() => <div>foo</div>);
        const promise = Promise.resolve('foo');

        const { unmount } = render(
            <PromiseStatus promise={ promise } delayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        unmount();

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(1);
        expect(childrenFn).toHaveBeenNthCalledWith(1, undefined);
    });
});

describe('resetFulfilledDelayMs option', () => {
    it('should reset status after the delay if fulfilled', async () => {
        const promise = Promise.resolve('foo');
        const childrenFn = jest.fn(() => <div>foo</div>);

        render(
            <PromiseStatus promise={ promise } resetFulfilledDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(3);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
        expect(childrenFn).toHaveBeenNthCalledWith(3, undefined);
    });

    it('should not reset status after the delay if rejected', async () => {
        const error = new Error('foo');
        const promise = Promise.reject(error);
        const childrenFn = jest.fn(() => <div>foo</div>);

        promise.catch(() => {});

        render(
            <PromiseStatus promise={ promise } resetFulfilledDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'rejected', value: error });
    });

    it('should cleanup correctly if promise changes in between', async () => {
        const promise1 = Promise.resolve('foo');
        const promise2 = Promise.resolve('bar');
        const childrenFn = jest.fn(() => <div>foo</div>);

        const { rerender } = render(
            <PromiseStatus promise={ promise1 } resetFulfilledDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
        childrenFn.mockClear();

        rerender(
            <PromiseStatus promise={ promise2 } resetFulfilledDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(4);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'fulfilled', value: 'foo' });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(3, { status: 'fulfilled', value: 'bar' });
        expect(childrenFn).toHaveBeenNthCalledWith(4, undefined);
    });

    it('should cleanup correctly on unmount', async () => {
        const promise = Promise.resolve('foo');
        const childrenFn = jest.fn(() => <div>foo</div>);

        const { unmount } = render(
            <PromiseStatus promise={ promise } resetFulfilledDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        unmount();

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(1);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    });
});

describe('resetRejectedDelayMs option', () => {
    it('should reset status after the delay if rejected', async () => {
        const error = new Error('foo');
        const promise = Promise.reject(error);
        const childrenFn = jest.fn(() => <div>foo</div>);

        promise.catch(() => {});

        render(
            <PromiseStatus promise={ promise } resetRejectedDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(3);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'rejected', value: error });
        expect(childrenFn).toHaveBeenNthCalledWith(3, undefined);
    });

    it('should not reset status after the delay if fulfilled', async () => {
        const promise = Promise.resolve('foo');
        const childrenFn = jest.fn(() => <div>foo</div>);

        render(
            <PromiseStatus promise={ promise } resetRejectedDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'fulfilled', value: 'foo' });
    });

    it('should cleanup correctly if promise changes in between', async () => {
        const error1 = new Error('foo');
        const promise1 = Promise.reject(error1);
        const error2 = new Error('foo');
        const promise2 = Promise.reject(error2);
        const childrenFn = jest.fn(() => <div>foo</div>);

        promise1.catch(() => {});
        promise2.catch(() => {});

        const { rerender } = render(
            <PromiseStatus promise={ promise1 } resetRejectedDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(10);

        expect(childrenFn).toHaveBeenCalledTimes(2);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'rejected', value: error1 });
        childrenFn.mockClear();

        rerender(
            <PromiseStatus promise={ promise2 } resetRejectedDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(4);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'rejected', value: error1 });
        expect(childrenFn).toHaveBeenNthCalledWith(2, { status: 'pending', value: undefined });
        expect(childrenFn).toHaveBeenNthCalledWith(3, { status: 'rejected', value: error2 });
        expect(childrenFn).toHaveBeenNthCalledWith(4, undefined);
    });

    it('should cleanup correctly on unmount', async () => {
        const promise = Promise.reject(new Error('foo'));
        const childrenFn = jest.fn(() => <div>foo</div>);

        promise.catch(() => {});

        const { unmount } = render(
            <PromiseStatus promise={ promise } resetRejectedDelayMs={ 100 }>
                { childrenFn }
            </PromiseStatus>
        );

        unmount();

        await pDelay(110);

        expect(childrenFn).toHaveBeenCalledTimes(1);
        expect(childrenFn).toHaveBeenNthCalledWith(1, { status: 'pending', value: undefined });
    });
});
