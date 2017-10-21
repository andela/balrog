import json
import logging
from auslib.global_state import dbo
from connexion import problem, request
from flask import jsonify
from auslib.web.common.history import HistoryHelper
from auslib.web.common.rules import get_rules
from auslib.web.common.releases import get_releases, process_release_revisions
from auslib.web.admin.views.permissions import UsersView, PermissionScheduledChangeHistoryView
from auslib.web.admin.views.rules import RuleScheduledChangeHistoryView
from auslib.web.admin.views.releases import ReleaseScheduledChangeHistoryView
from auslib.web.admin.views.required_signoffs import ProductRequiredSignoffsHistoryAPIView
from auslib.web.admin.views.required_signoffs import PermissionsRequiredSignoffsHistoryAPIView


log = logging.getLogger(__name__)


def _get_filters(obj, history_table):
    input_dict = _get_input_dict()
    query = json.loads(input_dict.data)['query']
    where = [False, False]
    try:
        where = [getattr(history_table, f) == query.get(f) for f in query]
        return where
    except AttributeError:
        return where


def _get_histories(table, obj, process_revisions_callback=None):
    history_table = table
    order_by = [history_table.timestamp.desc()]
    history_helper = HistoryHelper(hist_table=history_table,
                                   order_by=order_by,
                                   get_object_callback=lambda: obj,
                                   history_filters_callback=_get_filters,
                                   obj_not_found_msg='No history found',
                                   process_revisions_callback=process_revisions_callback)
    try:
        return history_helper.get_unlimted_histories()
    except (ValueError, AssertionError) as msg:
        log.warning("Bad input: %s", msg)
        return problem(400, "Bad Request", "Error occurred when trying to fetch histories",
                       ext={"exception": str(msg)})


def get_rules_histories():
    history_table = dbo.rules.history
    return _get_histories(history_table, get_rules)


def get_releases_histories():
    history_table = dbo.releases.history
    return _get_histories(history_table, get_releases, process_release_revisions)


def get_permissions_histories():
    history_table = dbo.permissions.history
    get_permissions = UsersView().get()
    return _get_histories(history_table, get_permissions)


def get_permissions_scheduled_change_histories():
    """GET /history/scheduled_changes/permissions"""
    return PermissionScheduledChangeHistoryView().get_all()


def get_rules_scheduled_change_histories():
    """GET /history/scheduled_changes/permissions"""
    return RuleScheduledChangeHistoryView().get_all()


def get_releases_scheduled_change_histories():
    """GET /history/scheduled_changes/permissions"""
    return ReleaseScheduledChangeHistoryView().get_all()


def get_product_required_signoffs_histories():
    return ProductRequiredSignoffsHistoryAPIView().get_all()


def get_permissions_required_signoffs_histories():
    return PermissionsRequiredSignoffsHistoryAPIView().get_all()


def _get_input_dict():
    table_constants = [
        'rules',
        'releases',
        'permissions'
        ]
    args = request.args
    query_keys = []
    query = {}
    for key in args:
        if not key in table_constants and key != 'limit' and key != 'page':
            query_keys.append(key)

    for key in query_keys:
        query[key] = request.args.get(key)
    return jsonify(query_keys=query_keys, query=query)


def method_constants():
    return {
        'rules': get_rules_histories(),
        'releases': get_releases_histories(),
        'permissions': get_permissions_histories(),
        'permissions_required_signoffs_histories': get_permissions_required_signoffs_histories(),
        'product_required_signoffs_histories': get_product_required_signoffs_histories(),
        'releases_scheduled_change_histories': get_releases_scheduled_change_histories(),
        'rules_scheduled_change_histories': get_rules_scheduled_change_histories(),
        'permissions_scheduled_change_histories': get_permissions_scheduled_change_histories(),
    }


def get_filtered_history():
    rrp_constants = ['rules', 'releases', 'permissions']
    methods = method_constants()
    histories = {}
    print('request', request.args)
    for constant in rrp_constants:
        if (request.args.get(constant)) == '1':
            history = methods.get(constant)
            histories[constant] = json.loads(history.data)
    
    return histories