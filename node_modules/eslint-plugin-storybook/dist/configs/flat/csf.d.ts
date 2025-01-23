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
        'storybook/csf-component': string;
        'storybook/default-exports': string;
        'storybook/hierarchy-separator': string;
        'storybook/no-redundant-story-name': string;
        'storybook/story-exports': string;
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
        'storybook/csf-component'?: undefined;
        'storybook/default-exports'?: undefined;
        'storybook/hierarchy-separator'?: undefined;
        'storybook/no-redundant-story-name'?: undefined;
        'storybook/story-exports'?: undefined;
    };
    plugins?: undefined;
})[];
export = _default;
