declare const _default: {
    configs: {
        csf: {
            plugins: string[];
            overrides: ({
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
            } | {
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
            })[];
        };
        'csf-strict': {
            extends: string;
            rules: {
                'react-hooks/rules-of-hooks': string;
                'import/no-anonymous-default-export': string;
                'storybook/no-stories-of': string;
                'storybook/no-title-property-in-meta': string;
            };
        };
        'addon-interactions': {
            plugins: string[];
            overrides: ({
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
            } | {
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
            })[];
        };
        recommended: {
            plugins: string[];
            overrides: ({
                files: string[];
                rules: {
                    'react-hooks/rules-of-hooks': string;
                    'import/no-anonymous-default-export': string;
                    'storybook/await-interactions': string;
                    'storybook/context-in-play-function': string;
                    'storybook/default-exports': string;
                    'storybook/hierarchy-separator': string;
                    'storybook/no-redundant-story-name': string;
                    'storybook/prefer-pascal-case': string;
                    'storybook/story-exports': string;
                    'storybook/use-storybook-expect': string;
                    'storybook/use-storybook-testing-library': string;
                    'storybook/no-uninstalled-addons'?: undefined;
                };
            } | {
                files: string[];
                rules: {
                    'storybook/no-uninstalled-addons': string;
                    'react-hooks/rules-of-hooks'?: undefined;
                    'import/no-anonymous-default-export'?: undefined;
                    'storybook/await-interactions'?: undefined;
                    'storybook/context-in-play-function'?: undefined;
                    'storybook/default-exports'?: undefined;
                    'storybook/hierarchy-separator'?: undefined;
                    'storybook/no-redundant-story-name'?: undefined;
                    'storybook/prefer-pascal-case'?: undefined;
                    'storybook/story-exports'?: undefined;
                    'storybook/use-storybook-expect'?: undefined;
                    'storybook/use-storybook-testing-library'?: undefined;
                };
            })[];
        };
        'flat/csf': ({
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
        'flat/csf-strict': ({
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
        } | {
            name: string;
            rules: {
                'react-hooks/rules-of-hooks': string;
                'import/no-anonymous-default-export': string;
                'storybook/no-stories-of': string;
                'storybook/no-title-property-in-meta': string;
            };
        })[];
        'flat/addon-interactions': ({
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
        'flat/recommended': ({
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
                'storybook/default-exports': string;
                'storybook/hierarchy-separator': string;
                'storybook/no-redundant-story-name': string;
                'storybook/prefer-pascal-case': string;
                'storybook/story-exports': string;
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
                'storybook/default-exports'?: undefined;
                'storybook/hierarchy-separator'?: undefined;
                'storybook/no-redundant-story-name'?: undefined;
                'storybook/prefer-pascal-case'?: undefined;
                'storybook/story-exports'?: undefined;
                'storybook/use-storybook-expect'?: undefined;
                'storybook/use-storybook-testing-library'?: undefined;
            };
            plugins?: undefined;
        })[];
    };
    rules: {
        'await-interactions': import("@typescript-eslint/utils/ts-eslint").RuleModule<"interactionShouldBeAwaited" | "fixSuggestion", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'context-in-play-function': import("@typescript-eslint/utils/ts-eslint").RuleModule<"passContextToPlayFunction", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'csf-component': import("@typescript-eslint/utils/ts-eslint").RuleModule<"missingComponentProperty", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'default-exports': import("@typescript-eslint/utils/ts-eslint").RuleModule<"fixSuggestion" | "shouldHaveDefaultExport", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'hierarchy-separator': import("@typescript-eslint/utils/ts-eslint").RuleModule<"useCorrectSeparators" | "deprecatedHierarchySeparator", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'meta-inline-properties': import("@typescript-eslint/utils/ts-eslint").RuleModule<"metaShouldHaveInlineProperties", [{
            csfVersion: number;
        }], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'no-redundant-story-name': import("@typescript-eslint/utils/ts-eslint").RuleModule<"removeRedundantName" | "storyNameIsRedundant", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'no-stories-of': import("@typescript-eslint/utils/ts-eslint").RuleModule<"doNotUseStoriesOf", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'no-title-property-in-meta': import("@typescript-eslint/utils/ts-eslint").RuleModule<"removeTitleInMeta" | "noTitleInMeta", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'no-uninstalled-addons': import("@typescript-eslint/utils/ts-eslint").RuleModule<"addonIsNotInstalled", [{
            packageJsonLocation: string;
            ignore: string[];
        }], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'prefer-pascal-case': import("@typescript-eslint/utils/ts-eslint").RuleModule<"convertToPascalCase" | "usePascalCase", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'story-exports': import("@typescript-eslint/utils/ts-eslint").RuleModule<"shouldHaveStoryExport" | "shouldHaveStoryExportWithFilters" | "addStoryExport", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'use-storybook-expect': import("@typescript-eslint/utils/ts-eslint").RuleModule<string, {
            storybookJestPath?: string | undefined;
        }[], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        'use-storybook-testing-library': import("@typescript-eslint/utils/ts-eslint").RuleModule<"updateImports" | "dontUseTestingLibraryDirectly", [], import("./types").StorybookRuleMetaDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
    };
};
export = _default;
