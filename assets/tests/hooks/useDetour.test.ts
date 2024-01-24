import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { fetchDetourDirections } from "../../src/api"
import { renderHook, waitFor } from "@testing-library/react"
import { useDetour } from "../../src/hooks/useDetour"
import { act } from "react-dom/test-utils"
import { coordinate } from "../../src/util/geographicCoordinate"

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockResolvedValue(null)
})

describe("useDetour", () => {
  test("when `addConnectionPoint` is first called, `startPoint` is set", () => {
    const start = coordinate(0, 0)

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))

    expect(result.current.startPoint).toBe(start)
  })

  test("when `addConnectionPoint` is called a second time, `endPoint` is set", () => {
    const start = coordinate(0, 0)
    const end = coordinate(1, 1)

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addConnectionPoint(end))

    expect(result.current.startPoint).toBe(start)
    expect(result.current.endPoint).toBe(end)
  })

  test("when `startPoint` is null, `addWaypoint` does nothing", () => {
    const { result } = renderHook(useDetour)

    expect(result.current.startPoint).toBeNull()

    act(() => result.current.addWaypoint({ latitude: 0, longitude: 0 }))

    expect(result.current.waypoints).toEqual([])
  })

  test("when `endPoint` is set, `addWaypoint` does nothing", () => {
    const start = coordinate(0, 0)
    const end = coordinate(1, 1)

    const { result } = renderHook(useDetour)

    expect(result.current.startPoint).toBeNull()

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addConnectionPoint(end))

    act(() => result.current.addWaypoint({ latitude: 0, longitude: 0 }))

    expect(result.current.waypoints).toEqual([])
  })

  test("when `addWaypoint` is called, `detourShape` is updated", async () => {
    const start = coordinate(0, 0)
    const end = coordinate(1, 1)
    const apiResult = [coordinate(-1, -1), coordinate(-2, -2)]

    jest.mocked(fetchDetourDirections).mockImplementation((coordinates) => {
      expect(coordinates).toStrictEqual([start, end])
      return Promise.resolve({ coordinates: apiResult })
    })

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addWaypoint(end))

    expect(result.current.startPoint).toBe(start)

    expect(jest.mocked(fetchDetourDirections)).toHaveBeenNthCalledWith(1, [
      start,
      end,
    ])

    await waitFor(() =>
      expect(result.current.detourShape).toStrictEqual(apiResult)
    )
  })

  test("when `undoLastWaypoint` is called, removes the last `waypoint`", async () => {
    const start = coordinate(0, 0)
    const end = coordinate(1, 1)

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addWaypoint(end))

    expect(result.current.waypoints).toStrictEqual([end])

    act(() => result.current.undoLastWaypoint())

    expect(result.current.waypoints).toStrictEqual([])
  })

  test("when `undoLastWaypoint` is called, should call API with updated waypoints", async () => {
    const start = coordinate(0, 0)
    const mid = coordinate(0.5, 0.5)
    const end = coordinate(1, 1)

    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint(start))
    act(() => result.current.addWaypoint(mid))
    act(() => result.current.addWaypoint(end))
    act(() => result.current.undoLastWaypoint())

    expect(jest.mocked(fetchDetourDirections)).toHaveBeenCalledTimes(3)
    expect(jest.mocked(fetchDetourDirections)).toHaveBeenNthCalledWith(3, [
      start,
      mid,
    ])
  })

  test("when `waypoints` is empty, `canUndo` is `false`", async () => {
    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint({ latitude: 0, longitude: 0 }))

    expect(result.current.waypoints).toStrictEqual([])
    expect(result.current.canUndo).toBe(false)
  })

  test("when `waypoints` is not empty, `canUndo` is `true`", async () => {
    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint({ latitude: 0, longitude: 0 }))
    act(() => result.current.addWaypoint({ latitude: 1, longitude: 1 }))

    expect(result.current.canUndo).toBe(true)
  })

  test("when `endPoint` is set, `canUndo` is `false`", async () => {
    const { result } = renderHook(useDetour)

    act(() => result.current.addConnectionPoint({ latitude: 0, longitude: 0 }))
    act(() => result.current.addConnectionPoint({ latitude: 0, longitude: 0 }))

    expect(result.current.canUndo).toBe(false)
  })
})
