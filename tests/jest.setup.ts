try {
    const matchers = require('jest-extended');
    expect.extend(matchers);
} catch (error) {
    expect.extend({});
}

afterEach(() => {
    jest.useRealTimers();
});
