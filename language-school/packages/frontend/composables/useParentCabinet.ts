import { useEden } from '~/composables/useEden'

/**
 * Composable for parent cabinet API calls via Eden Treaty.
 * All endpoints require PARENT role and ownership of the child.
 */
export const useParentCabinet = () => {
  const api = useEden()

  /**
   * Get list of parent's children (id, username, first_name, last_name, full_name, avatar)
   */
  const getChildren = () =>
    api.api.v1.cabinet.children.get()

  /**
   * Get a child's enrolled groups with progress info
   */
  const getChildGroups = (childId: string) =>
    api.api.v1.cabinet.parent.children[':childId'].groups.get({
      params: { childId },
    })

  /**
   * Get a child's gems balance and transactions
   */
  const getChildGems = (childId: string) =>
    api.api.v1.cabinet.parent.children[':childId'].gems.get({
      params: { childId },
    })

  /**
   * Get a child's payment history
   */
  const getChildPayments = (childId: string) =>
    api.api.v1.cabinet.parent.children[':childId'].payments.get({
      params: { childId },
    })

  /**
   * Get a child's exam grades for a specific group
   */
  const getChildGrades = (childId: string, groupId: string) =>
    api.api.v1.cabinet.parent.children[':childId'].grades[':groupId'].get({
      params: { childId, groupId },
    })

  return {
    getChildren,
    getChildGroups,
    getChildGems,
    getChildPayments,
    getChildGrades,
  }
}
