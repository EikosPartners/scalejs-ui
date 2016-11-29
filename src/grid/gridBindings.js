import 'datatables.net-fixedheader';
import 'datatables.net-select';

export default {
    grid: function () {
        const options = this.options,
            clientSearch = options.clientSearch,
            caseInsen = this.caseInsensitive,
            gridSettings = {
                dom: 't',
                rows: this.rows,
                columns: this.columns,
                data: this.data,
                paging: false,
                fixedHeader: options.fixedHeader,
                infiniteScroll: options.infinite,
                query: this.sendQuery,
                searching: clientSearch,
                select: {
                    style: 'single',
                    blurable: true,
                    className: 'highlight',
                    selectedItem: this.selectedItem
                }
            };

        if (clientSearch) {
            gridSettings.clientSearch = {
                basicSearch: this.search,
                advancedSearch: this.filters,
                caseInsen
            };
        }

        return {
            css: this.classes,
            dataTables: gridSettings
        };
    },
    'grid-loader': function () {
        const styles = this.loader.inProgress() ? 'active' : '';
        return {
            css: styles
        };
    }
};