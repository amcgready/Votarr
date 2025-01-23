declare const _default: ({
    name: string;
    plugins: {
        readonly storybook: any;
    };
    files?: undefined;
    rules?: undefined;
} | {
    name: string;
    files: string[];
    rules: {
        'react-hooks/rules-of-hooks': string;
        'import/no-anonymous-default-export': string;
        'storybook/await-interactions': string;
        'storybook/context-in-play-function': string;
        'storybook/use-storybook-expect': string;
        'storybook/use-storybook-testing-library': string;
        'storybook/no-uninstalled-addons'?: undefined;
    };
    plugins?: undefined;
} | {
    name: string;
    files: string[];
    rules: {
        'storybook/no-uninstalled-addons': string;
        'react-hooks/rules-of-hooks'?: undefined;
        'import/no-anonymous-default-export'?: undefined;
        'storybook/await-interactions'?: undefined;
        'storybook/context-in-play-function'?: undefined;
        'storybook/use-storybook-expect'?: undefined;
        'storybook/use-storybook-testing-library'?: undefined;
    };
    plugins?: undefined;
})[];
export = _default;
